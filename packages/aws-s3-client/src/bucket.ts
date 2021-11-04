import path from 'path'
import _ from 'lodash'
import { Errors, KeyValueStoreExtended } from '@tradle/aws-common-utils'
// import { cachify } from './utils'
import {
  PutOpts,
  BucketOpts,
  CopyFilesToOpts,
  ListBucketOpts,
  ListOptsMinusBucket,
  EnableEncryptionOpts
} from './types'
import { S3Client } from './client'
import { createJsonKVStore, createGzippedJsonKVStore, createKVStore } from './kv'

// type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never

export class Bucket implements KeyValueStoreExtended {
  public get id() {
    return this.bucket // alias
  }
  public get name() {
    return this.bucket // alias
  }
  public bucket: string
  public prefix: string
  public client: S3Client
  constructor(private opts: BucketOpts) {
    const { bucket, client, prefix = '' } = opts
    if (typeof bucket !== 'string') {
      throw new Error('expected string "bucket"')
    }

    this.bucket = bucket
    this.client = client
    this.prefix = prefix
  }

  public folder = (prefix: string): Bucket => {
    return new Bucket({
      ...this.opts,
      prefix: getFolderPath(this.prefix, prefix)
    })
  }

  public sub = (prefix: string): Bucket => {
    return new Bucket({
      ...this.opts,
      prefix: this._getKey(prefix)
    })
  }

  public withPrefix = (prefix: string): Bucket => {
    return new Bucket({
      ...this.opts,
      prefix: this.prefix + prefix
    })
  }

  public get = (key: string) =>
    this.client.get({
      key: this._getKey(key),
      bucket: this.bucket
    })

  public maybeGet = (key: string) => this.get(key).catch(Errors.ignoreNotFound)

  public getJSON = (key: string) => this.get(key).then(({ Body }) => JSON.parse(Body.toString()))
  public maybeGetJSON = (key: string) => this.getJSON(key).catch(Errors.ignoreNotFound)

  public list = (opts: Omit<ListBucketOpts, 'bucket'>) =>
    this.client.listBucket({ bucket: this.bucket, ...opts })
  public listObjects = (opts: Omit<ListBucketOpts, 'bucket'>) =>
    this.client.listObjects({ bucket: this.bucket, ...opts })
  public listWithPrefix = (prefix: string, listOpts?: ListOptsMinusBucket) => {
    this.client.listBucketWithPrefix({
      bucket: this.bucket,
      prefix: this._getKey(prefix),
      s3Opts: listOpts
    })
  }

  public listObjectsWithKeyPrefix = (prefix: string, listOpts?: ListOptsMinusBucket) =>
    this.client.listObjectsWithKeyPrefix({
      bucket: this.bucket,
      prefix: this._getKey(prefix),
      s3Opts: listOpts
    })

  public put = async (key: string, value, opts?: Partial<PutOpts>) => {
    // don't return a value, because the caching wrapper assumes there is none
    await this.client.put({
      key: this._getKey(key),
      value,
      bucket: this.bucket,
      ...opts
    })
  }

  public putJSON = (key: string, value, opts?: Partial<PutOpts>) => this.put(key, value, opts)
  public gzipAndPut = (key: string, value, opts: Partial<PutOpts> = {}) =>
    this.client.gzipAndPut({
      key: this._getKey(key),
      value,
      bucket: this.bucket,
      ...opts
    })

  public head = (key: string) => this.client.head({ key: this._getKey(key), bucket: this.bucket })
  public exists = (key: string) => this.client.exists({ key: this._getKey(key), bucket: this.bucket })
  public has = this.exists
  public del = (key: string) => this.client.del({ key: this._getKey(key), bucket: this.bucket })
  public getCacheable = opts =>
    this.client.getCacheable({
      ...opts,
      key: this._getKey(opts.key),
      bucket: this.bucket
    })

  public create = () => this.client.createBucket({ bucket: this.bucket })
  public destroy = () => this.client.destroyBucket({ bucket: this.bucket })
  public clear = () => this.client.clearBucket({ bucket: this.bucket })
  public toString = () => this.bucket
  public getUrlForKey = (key: string) =>
    this.client.getUrlForKey({
      key: this._getKey(key),
      bucket: this.bucket
    })

  public forEach = opts => this.client.forEachItemInBucket({ bucket: this.bucket, ...opts })
  public enableEncryption = (opts: Omit<EnableEncryptionOpts, 'bucket'>) =>
    this.client.enableEncryption({ bucket: this.bucket, ...opts })
  public disableEncryption = () => this.client.disableEncryption({ bucket: this.bucket })
  public getEncryption = () => this.client.getEncryption({ bucket: this.bucket })
  // TODO: use head (to get ETag), and compare MD5
  public putIfDifferent = async (key: string, value: any): Promise<boolean> => {
    key = this._getKey(key)
    let current
    try {
      current = await this.get(key)
    } catch (err) {
      Errors.ignoreNotFound(err)
    }

    if (!_.isEqual(current, value)) {
      this.put(key, value)
      return true
    }

    return false
  }

  public makePublic = () => this.client.makePublic({ bucket: this.bucket })
  public empty = () => this.client.emptyBucket({ bucket: this.bucket })
  public copyFilesTo = ({ bucket, keys, prefix, acl }: CopyFilesToOpts) =>
    this.client.copyFilesBetweenBuckets({
      source: this.bucket,
      target: bucket,
      keys,
      prefix,
      acl
    })

  public isPublic = () => this.client.isBucketPublic({ bucket: this.bucket })
  public makeKeysPublic = (keys: string[]) => this.client.makeKeysPublic({ bucket: this.bucket, keys })
  public createPresignedUrl = (key: string) =>
    this.client.createPresignedUrl({
      key: this._getKey(key),
      bucket: this.bucket
    })

  public kv = () => createKVStore({ folder: this })
  public kvWithGzip = () => createKVStore({ folder: this })
  public jsonKV = () => createJsonKVStore({ folder: this })
  public jsonKVWithGzip = () => createGzippedJsonKVStore({ folder: this })

  // public grantReadAccess = async (opts) => this.client.grantReadAccess({ bucket: this.name, ...opts })
  private _getKey = (key: string) => this.prefix + key
}

const getFolderPath = (parent: string, folder: string): string => {
  const fPath = path.join(parent, folder)
  return fPath.replace(/[/]+$/, '') + '/'
}

export { Bucket as Folder }
export const wrapBucket = (opts: BucketOpts): Bucket => new Bucket(opts)
export const wrapFolder = wrapBucket
