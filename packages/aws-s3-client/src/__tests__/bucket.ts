import AWS, { Request, S3, AWSError } from 'aws-sdk'
import test from 'tape'
import sinon from 'sinon'
import Cache from 'lru-cache'
import { createClientFactory } from '@tradle/aws-client-factory'
import { initTest, testKV } from '@tradle/aws-common-utils/lib/test'
import { randomString } from '@tradle/aws-common-utils'
import { wrapBucket, wrapBucketMemoized, createClient } from '..'
import { createJsonKVStore } from '../kv'
import { Bucket } from '../bucket'

initTest(AWS)

const clients = createClientFactory({
  AWS,
  defaults: { region: 'us-east-1' }
})

const s3 = clients.s3()
const client = createClient({ client: s3 })

test('getCacheable', async t => {
  const sandbox = sinon.createSandbox()
  const bucketName = `test-${randomString(10)}`
  const bucket = wrapBucket({ bucket: bucketName, client })
  try {
    await bucket.create()
  } catch (e) {
    console.log(e)
    console.warn('Did you maybe not start a local test server?')
    return
  }

  const key = 'a'
  const cacheable = bucket.getCacheable({
    key,
    parse: JSON.parse.bind(JSON),
    ttl: 100
  })

  try {
    await cacheable.get()
    t.fail('expected error')
  } catch (err) {
    t.equal(err.name, 'NotFound')
  }

  let value = { a: 1 }
  await cacheable.put({ value })

  const getObjectSpy = sandbox.spy(s3, 'getObject')
  t.same(await cacheable.get(), value)
  t.equal(getObjectSpy.callCount, 0)
  t.same(await cacheable.get(), value)
  t.equal(getObjectSpy.callCount, 0)

  value = { a: 2 }
  await bucket.putJSON(key, value)
  await new Promise(resolve => setTimeout(resolve, 200))
  t.same(await cacheable.get(), value)
  t.equal(getObjectSpy.callCount, 1)
  t.same(await cacheable.get(), value)
  t.equal(getObjectSpy.callCount, 1)

  getObjectSpy.restore()
  await bucket.del(key)
  await s3.deleteBucket({ Bucket: bucketName }).promise()

  sandbox.restore()
})

test('Bucket', async t => {
  const bucketName = `test-${Date.now()}-${randomString(10)}`
  const bucket = wrapBucket({ bucket: bucketName, client })
  await bucket.create()

  const ops: { method: keyof Bucket, args: any[], result?: any, body?: Buffer, error?: string }[] = [
    { method: 'exists', args: ['abc'], result: false },
    { method: 'get', args: ['abc'], error: 'NotFound' },
    { method: 'getJSON', args: ['abc'], error: 'NotFound' },
    { method: 'put', args: ['abc', { cba: 1 }] },
    { method: 'exists', args: ['abc'], result: true },
    { method: 'get', args: ['abc'], body: new Buffer(JSON.stringify({ cba: 1 })) },
    { method: 'getJSON', args: ['abc'], result: { cba: 1 } },
    { method: 'del', args: ['abc'] },
    { method: 'exists', args: ['abc'], result: false },
    { method: 'exists', args: ['abcd'], result: false },
    { method: 'del', args: ['abcd'], result: undefined },
    { method: 'getJSON', args: ['abc'], error: 'NotFound' }
    // TODO: uncomment when localstack supports gzip ContentEncoding
    // { method: 'gzipAndPut', args: ['abc', { cba: 1 }] },
    // { method: 'getJSON', args: ['abc'], result: { cba: 1 }, stop: true },
    // { method: 'del', args: ['abc'], result: undefined }
  ]

  for (const op of ops) {
    const { method, args, result, body, error } = op
    try {
      const actualResult = await (bucket[method] as Function).apply(bucket, args)
      const msg = `${method}(${args})`
      if (error) {
        t.fail(`${msg} expected error: ${error}`)
      } else if (typeof result !== 'undefined') {
        t.same(actualResult, result, `${msg} ${actualResult} != ${result}`)
      } else if (typeof body !== 'undefined') {
        t.same(actualResult.Body, body, `${msg} ${actualResult.Body} != ${body}`)
      }
    } catch (err) {
      t.equal(err.name, error)
    }
  }

  await bucket.destroy()
})

test('Bucket with cache', async t => {
  const sandbox = sinon.createSandbox()
  const bucketName = `test-${Date.now()}-${randomString(10)}`
  const bucket = wrapBucketMemoized({
    bucket: bucketName,
    client,
    cache: new Cache({ maxAge: 500 })
  })

  await bucket.create()

  const ops: { method: keyof Bucket, args: any[], result?: any, body?: Buffer, error?: string, cached?: boolean }[] = [
    { method: 'exists', args: ['abc'], result: false },
    { method: 'get', args: ['abc'], error: 'NotFound' },
    { method: 'getJSON', args: ['abc'], error: 'NotFound' },
    { method: 'putJSON', args: ['abc', { cba: 1 }] },
    { method: 'exists', args: ['abc'], result: true },
    { method: 'get', args: ['abc'], body: new Buffer(JSON.stringify({ cba: 1 })) },
    { method: 'getJSON', args: ['abc'], result: { cba: 1 }, cached: true },
    { method: 'del', args: ['abc'] },
    { method: 'exists', args: ['abc'], result: false },
    { method: 'exists', args: ['abcd'], result: false },
    { method: 'del', args: ['abcd'], result: undefined }
  ]

  for (const op of ops) {
    await new Promise(resolve => setTimeout(resolve, 50))
    const { method, args, result, body, cached, error } = op
    let getObjStub
    if (cached) {
      getObjStub = sandbox.stub(s3, 'getObject').callsFake((): Request<S3.Types.GetObjectOutput, AWSError> => {
        t.fail('expected object to be cached')
        throw new Error()
      })
    }

    try {
      const actualResult = await (bucket[method] as Function).apply(bucket, args)
      const msg = `${method}(${args})`
      if (error) {
        t.fail(`${msg} expected error: ${error}`)
      } else if (typeof result !== 'undefined') {
        t.same(actualResult, result, `${msg} ${actualResult} != ${result}`)
      } else if (typeof body !== 'undefined') {
        t.same(actualResult.Body, body, `${msg} ${actualResult.Body} != ${body}`)
      }
    } catch (err) {
      t.equal(err.name, error)
    } finally {
      if (getObjStub) {
        getObjStub.restore()
      }
    }
  }

  await bucket.destroy()
  sandbox.restore()
})
;(async () => {
  const bucket = wrapBucket({
    bucket: `test-${randomString(10)}`,
    client
  })

  await bucket.create()
  testKV({
    name: 's3 kv',
    create: () => createJsonKVStore({ folder: bucket }),
    done: () => bucket.destroy()
  })
})()
