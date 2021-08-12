import { parse as parseUrl } from 'url'
import { promisify } from 'util'
import zlib from 'zlib'
import omit from 'lodash/omit'
import { uriEscapePath } from 'aws-sdk/lib/util'
import _parseS3Url from 'amazon-s3-uri'
import emptyBucket from 'empty-aws-bucket'
import caseless from 'caseless'
import { Errors, toStringOrBuf, isLocalHost, isLocalUrl, IAMStatement } from '@tradle/aws-common-utils'
import { isPromise, batchProcess } from '@tradle/promise-utils'
import { S3 } from 'aws-sdk'
import * as Types from './types'

const gzip = promisify(zlib.gzip.bind(zlib))
const gunzip = promisify(zlib.gunzip.bind(zlib))

// https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
// IMPORTANT: DON'T CHANGE THE ORDER, ONLY APPEND TO THIS LIST!
export const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'cn-north-1',
  'cn-northwest-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'ap-east-1',
  'sa-east-1',
  'me-south-1'
]


// see name restrictions: https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
const MAX_BUCKET_NAME_LENGTH = 63
const PUBLIC_BUCKET_RULE_ID = 'MakeItPublic'
const LOCAL_S3_PATH_NAME_REGEX = /^\/?([^/]+)\/(.*)/

interface HeaderToS3PutOption {
  [x: string]: keyof S3.PutObjectRequest
}

const mapToS3PutOption: HeaderToS3PutOption = {
  ContentType: 'ContentType',
  'content-type': 'ContentType',
  ContentEncoding: 'ContentEncoding',
  'content-encoding': 'ContentEncoding'
}

const toS3PutOption = caseless(mapToS3PutOption)

export const mapHeadersToS3PutOptions = (headers: any): Partial<S3.PutObjectRequest> => {
  const putOpts: Partial<S3.PutObjectRequest> = {}
  for (const name in headers) {
    const s3Option = toS3PutOption.get(name)
    if (!s3Option) {
      throw new Errors.InvalidInput(`unrecognized header: ${name}`)
    }

    putOpts[s3Option] = headers[name]
  }

  return putOpts
}

export interface S3ClientOpts {
  client: AWS.S3
}

export class S3Client {
  private s3: AWS.S3
  constructor({ client }: S3ClientOpts) {
    this.s3 = client
  }

  public put = async ({ key, value, bucket, headers = {}, acl }: Types.PutOpts) => {
    // logger.debug('putting', { key, bucket, type: value[TYPE] })
    const opts: S3.Types.PutObjectRequest = {
      ...mapHeadersToS3PutOptions(headers),
      Bucket: bucket,
      Key: key,
      Body: toStringOrBuf(value)
    }

    if (acl) opts.ACL = acl

    return await this.s3.putObject(opts).promise()
  }

  public gzipAndPut = async (opts: Types.PutOpts) => {
    const { value, headers = {} } = opts
    const compressed = await gzip(toStringOrBuf(value))
    return await this.put({
      ...opts,
      value: compressed,
      headers: {
        ...headers,
        ContentEncoding: 'gzip'
      }
    })
  }

  public get = async ({ key, bucket, s3Opts }: Types.GetOpts): Promise<S3.Types.GetObjectOutput> => {
    const params: S3.Types.GetObjectRequest = {
      Bucket: bucket,
      Key: key,
      ...s3Opts
    }

    try {
      const result = await this.s3.getObject(params).promise()
      // logger.debug('got', { key, bucket, type: result[TYPE] })
      if (result.ContentEncoding === 'gzip') {
        // localstack gunzips but leaves ContentEncoding header
        result.Body = await gunzip(result.Body)
        delete result.ContentEncoding
      }

      return result
    } catch (err) {
      if (err.code === 'NoSuchKey') {
        throw new Errors.NotFound(`${bucket}/${key}`)
      }

      throw err
    }
  }

  public getByUrl = async (url: string) => {
    const { bucket, key } = parseS3Url(url)
    const props = { bucket, key }
    if (key.endsWith('.json') || key.endsWith('.json.gz')) {
      return this.getJSON(props)
    }

    return await this.get(props)
  }

  public forEachItemInBucket = async ({ bucket, getBody, map, s3Opts }: Types.ForEachItemInBucketOpts) => {
    const params: S3.Types.ListObjectsV2Request = {
      Bucket: bucket,
      ...s3Opts
    }

    while (true) {
      const { Contents, ContinuationToken } = await this.s3.listObjectsV2(params).promise()
      if (getBody) {
        await batchProcess({
          data: Contents,
          batchSize: 20,
          processOne: async (item, i) => {
            const withBody = await this.get({ bucket, key: item.Key })
            const result = map({ ...item, ...withBody }, i)
            if (isPromise(result)) await result
          }
        })
      } else {
        await Promise.all(
          Contents.map(async (item, i) => {
            const result = map(item, i)
            if (isPromise(result)) await result
          })
        )
      }

      if (!ContinuationToken) break

      params.ContinuationToken = ContinuationToken
    }
  }

  public listBuckets = async () => {
    const { Buckets } = await this.s3.listBuckets().promise()
    return Buckets.map(({ Name }) => Name)
  }

  public listObjects = async (opts: Types.ListBucketOpts): Promise<Types.S3ObjWithBody[]> => {
    return (await this.listBucket({ ...opts, getBody: true })) as Types.S3ObjWithBody[]
  }

  public listObjectsWithKeyPrefix = async (
    opts: Types.ForEachItemInBucketWithPrefixOpts
  ): Promise<Types.S3ObjWithBody[]> => {
    return (await this.listBucketWithPrefix({ ...opts, getBody: true })) as Types.S3ObjWithBody[]
  }

  public listBucket = async (opts: Types.ListBucketOpts): Promise<S3.Object[]> => {
    const all = []
    await this.forEachItemInBucket({
      ...opts,
      map: item => all.push(item)
    })

    return all
  }

  public clearBucket = async ({ bucket }: Types.BaseBucketOpts) => {
    await this.forEachItemInBucket({
      bucket,
      map: ({ Key }) => this.del({ bucket, key: Key })
    })
  }

  public getCacheable = ({ key, bucket, ttl, parse, ...defaultOpts }: Types.GetCacheableOpts) => {
    if (!key) throw new Error('expected "key"')
    if (!bucket) throw new Error('expected "bucket"')
    if (!ttl) throw new Error('expected "ttl"')

    let cached
    let type
    let etag
    let cachedTime = 0
    const invalidateCache = () => {
      cached = undefined
      type = undefined
      etag = undefined
      cachedTime = 0
    }

    const maybeGet = async (opts: any = {}) => {
      const summary = { key, bucket, type }
      if (!opts.force) {
        const age = Date.now() - cachedTime
        if (etag && age < ttl) {
          // this.logger.debug('returning cached item', {
          //   ...summary,
          //   age,
          //   ttl: ttl - age
          // })

          return cached
        }
      }

      opts = {
        ...defaultOpts,
        ...omit(opts, ['force'])
      }

      if (etag) {
        opts.IfNoneMatch = etag
      }

      try {
        cached = await this.get({ key, bucket, ...opts })
      } catch (err) {
        if (err.code === 'NotModified') {
          // this.logger.debug('304, returning cached item', summary)
          return cached
        }

        throw err
      }

      if (cached.ETag !== etag) {
        etag = cached.ETag
      }

      if (parse) {
        cached = parse(cached.Body)
      }

      cachedTime = Date.now()
      // this.logger.debug('fetched and cached item', summary)

      return cached
    }

    const putAndCache = async ({ value, ...opts }) => {
      if (value == null) throw new Error('expected "value"')

      const result = await this.put({ bucket, key, value, ...defaultOpts, ...opts })
      cached = parse
        ? value
        : {
            Body: JSON.stringify(value),
            ...result
          }

      cachedTime = Date.now()
      etag = result.ETag
    }

    return {
      get: maybeGet,
      put: putAndCache,
      invalidateCache
    }
  }

  public putJSON = this.put

  public getJSON = ({ key, bucket }) => {
    return this.get({ key, bucket }).then(({ Body }) => JSON.parse(Body.toString()))
  }

  public head = async ({ key, bucket }: Types.BaseObjectOpts) => {
    try {
      return await this.s3
        .headObject({
          Bucket: bucket,
          Key: key
        })
        .promise()
    } catch (err) {
      if (err.code === 'NoSuchKey' || err.code === 'NotFound') {
        throw new Errors.NotFound(`${bucket}/${key}`)
      }

      throw err
    }
  }

  public exists = async ({ key, bucket }: Types.BaseObjectOpts) => {
    try {
      await this.head({ key, bucket })
      return true
    } catch (err) {
      Errors.ignoreNotFound(err)
      return false
    }
  }

  public del = async ({ key, bucket }: Types.BaseObjectOpts) => {
    await this.s3
      .deleteObject({
        Bucket: bucket,
        Key: key
      })
      .promise()
  }

  public createPresignedUrl = ({ bucket, key }: Types.BaseObjectOpts) => {
    const url = this.s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key
    })

    // if (this.publicFacingHost) {
    //   return url.replace(this.s3.config.endpoint, this.publicFacingHost)
    // }

    return url
  }

  public createBucket = async ({ bucket }) => {
    return await this.s3.createBucket({ Bucket: bucket }).promise()
  }

  public destroyBucket = async ({ bucket }) => {
    // this.logger.info('emptying and deleting bucket', { bucket })
    try {
      await this.emptyBucket({ bucket })
      await this.disableReplication({ bucket })
      await this.deleteBucket({ bucket })
    } catch (err) {
      Errors.ignore(err, { code: 'NoSuchBucket' })
    }
  }

  public disableReplication = async ({ bucket }: Types.BaseBucketOpts) => {
    await this.s3.deleteBucketReplication({ Bucket: bucket }).promise()
    // this.logger.error('failed to disable bucket replication', { bucket, error: err.stack })
    // localstack gives some weird error:
    //   'FakeDeleteMarker' object has no attribute 'name'
  }

  public deleteBucket = async ({ bucket }: Types.BaseBucketOpts) => {
    try {
      await this.s3.deleteBucket({ Bucket: bucket }).promise()
    } catch (err) {
      Errors.ignore(err, { code: 'NoSuchBucket' })
    }
  }

  public getUrlForKey = ({ bucket, key, region }: Types.BaseObjectOpts) => {
    const { host } = this.s3.endpoint
    const encodedKey = uriEscapePath(key)
    if (isLocalHost(host)) {
      return `http://${host}/${bucket}${encodedKey}`
    }
    if (region)
      return `https://${bucket}.s3.${region}.amazonaws.com/${encodedKey}`
    else
      return `https://${bucket}.s3.amazonaws.com/${encodedKey}`
  }

  public disableEncryption = async ({ bucket }: Types.BaseBucketOpts) => {
    // this.logger.info(`disabling server-side encryption from bucket ${bucket}`)
    await this.s3.deleteBucketEncryption({ Bucket: bucket }).promise()
  }

  public enableEncryption = async ({ bucket, kmsKeyId }: Types.EnableEncryptionOpts) => {
    // this.logger.info(`enabling server-side encryption for bucket ${bucket}`)
    const params = toEncryptionParams({ bucket, kmsKeyId })
    await this.s3.putBucketEncryption(params).promise()
  }

  public getEncryption = async ({ bucket }: Types.BaseBucketOpts) => {
    return await this.s3.getBucketEncryption({ Bucket: bucket }).promise()
  }

  public getLatest = (list: S3.Object[]): S3.Object => {
    let max = 0
    let latest
    for (const metadata of list) {
      const date = new Date(metadata.LastModified).getTime()
      if (date > max) {
        latest = metadata
        max = date
      }
    }

    return latest
  }

  public makePublic = async ({ bucket }: Types.BaseBucketOpts) => {
    // this.logger.warn(`making bucket public: ${bucket}`)
    await this.s3
      .putBucketPolicy({
        Bucket: bucket,
        Policy: `{
        "Version": "2012-10-17",
        "Statement": [{
          "Sid": "${PUBLIC_BUCKET_RULE_ID}",
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::${bucket}/*"
        }]
      }`
      })
      .promise()
  }

  public isBucketPublic = async ({ bucket }: Types.BaseBucketOpts) => {
    let result: Types.BucketPolicy
    try {
      result = await this.getBucketPolicy({ bucket })
    } catch (err) {
      Errors.ignoreNotFound(err)
      return false
    }

    return result.Statement.some(statement => isPublicBucketStatement({ statement, bucket }))
  }

  public getBucketPolicy = async ({ bucket }: Types.BaseBucketOpts) => {
    try {
      const { Policy } = await this.s3.getBucketPolicy({ Bucket: bucket }).promise()
      return JSON.parse(Policy)
    } catch (err) {
      Errors.ignoreNotFound(err)
      throw new Errors.NotFound(err.message)
    }
  }

  public makeKeysPublic = async ({ bucket, keys }: Types.BaseMultiKeyOpOpts) => {
    await this.setPolicyForKeys({ bucket, keys, policy: 'public-read' })
  }

  public setPolicyForKeys = async ({ bucket, keys, policy }: Types.SetPolicyForKeysOpts) => {
    await Promise.all(
      keys.map(key =>
        this.s3
          .putObjectAcl({
            Bucket: bucket,
            Key: key,
            ACL: policy
          })
          .promise()
      )
    )
  }

  public allowGuestToRead = async ({ bucket, keys }: Types.BaseMultiKeyOpOpts) => {
    const isPublic = await this.isBucketPublic({ bucket })
    if (!isPublic) {
      await this.makeKeysPublic({ bucket, keys })
    }
  }

  public deleteVersions = async ({ bucket, versions }: Types.DeleteVersonsOpts) => {
    await this.s3
      .deleteObjects({
        Bucket: bucket,
        Delete: {
          Objects: versions.map(({ Key, VersionId }) => ({ Key, VersionId }))
        }
      })
      .promise()
  }

  // copied from empty-aws-bucket
  public emptyBucket = async ({ bucket }: Types.BaseBucketOpts) => {
    const { s3 } = this
    return emptyBucket({ s3, bucket })
  }

  public listBucketWithPrefix = async ({ s3Opts, prefix, ...listOpts }: Types.ForEachItemInBucketWithPrefixOpts) => {
    return await this.listBucket({ s3Opts: { ...s3Opts, Prefix: prefix }, ...listOpts,  })
  }

  public copyFilesBetweenBuckets = async ({ source, target, keys, prefix, acl }: Types.BucketCopyOpts) => {
    if (!(prefix || keys)) throw new Errors.InvalidInput('expected "keys" or "prefix"')

    if (!keys) {
      const items = await this.listBucketWithPrefix({ bucket: source, prefix })
      keys = items.map(i => i.Key)
    }

    const baseParams: AWS.S3.CopyObjectRequest = {
      Bucket: target,
      CopySource: null,
      Key: null
    }

    if (acl) baseParams.ACL = acl

    await Promise.all(
      keys.map(async key => {
        const params = {
          ...baseParams,
          CopySource: `${source}/${key}`,
          Key: key
        }

        try {
          await this.s3.copyObject(params).promise()
        } catch (err) {
          Errors.ignoreNotFound(err)
          throw new Errors.NotFound(`bucket: "${target}", key: "${key}"`)
        }
      })
    )
  }

  // public grantReadAccess = async ({ bucket, keys }: {
  //   bucket: string
  //   keys: string[]
  // }) => {
  //   await this.s3.putObjectAcl({
  //     AccessControlPolicy: {
  //       Grants:
  //     }
  //   })
  // }

  public parseS3Url = parseS3Url
}

export const parseS3Url = (url: string) => {
  try {
    return _parseS3Url(url)
  } catch (err) {
    if (!isLocalUrl(url)) {
      throw new Errors.InvalidOption(`invalid s3 url: ${url}`)
    }
  }

  const parsed = parseUrl(url)
  const { pathname = '' } = parsed
  const match = pathname.match(LOCAL_S3_PATH_NAME_REGEX)
  if (!match) return

  const [bucket, key] = match.slice(1)
  if (bucket && key) return { bucket, key, isPathStyle: true }

  throw new Errors.InvalidInput(`invalid s3 url: ${url}`)
}

export const createClient = (opts: S3ClientOpts) => new S3Client(opts)

const toEncryptionParams = ({ bucket, kmsKeyId }): S3.PutBucketEncryptionRequest => {
  const ApplyServerSideEncryptionByDefault: S3.ServerSideEncryptionByDefault = {
    SSEAlgorithm: kmsKeyId ? 'aws:kms' : 'AES256'
  }

  if (kmsKeyId) {
    ApplyServerSideEncryptionByDefault.KMSMasterKeyID = kmsKeyId
  }

  return {
    Bucket: bucket,
    ServerSideEncryptionConfiguration: {
      Rules: [
        {
          ApplyServerSideEncryptionByDefault
        }
      ]
    }
  }
}

interface IsPublicBucketStatementOpts extends Types.BaseBucketOpts {
  statement: IAMStatement
}

const isPublicBucketStatement = ({ statement, bucket }: IsPublicBucketStatementOpts) => {
  const { Principal, Resource, Action } = statement
  return (
    Principal === '*' &&
    [].concat(Resource).some(r => r.includes(`:${bucket}/*`)) &&
    [].concat(Action).some(a => a.toLowerCase() === 's3:GetObject')
  )
}
