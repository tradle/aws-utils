import test from 'blue-tape'
import sinon from 'sinon'
import Cache from 'lru-cache'
import { createClientFactory } from '@tradle/aws-client-factory'
import { initTest, testKV } from '@tradle/aws-common-utils/lib/test'
import { randomString } from '@tradle/aws-common-utils'
import { createBucket, createMemoizedBucket, createClient } from './'
import { createKVStore } from './kv'

initTest()

const clients = createClientFactory({
  defaults: { region: 'us-east-1' }
})

const s3 = clients.s3()
const client = createClient({ client: s3 })

test('getCacheable', async t => {
  const sandbox = sinon.createSandbox()
  const bucketName = `test-${randomString(10)}`
  const bucket = createBucket({ bucket: bucketName, client })
  await bucket.create()

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
  const bucket = createBucket({ bucket: bucketName, client })
  await bucket.create()

  const ops: any[] = [
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
      const actualResult = await bucket[method](...args)
      if (error) {
        t.fail(`expected error: ${error}`)
      } else if (typeof result !== 'undefined') {
        t.same(actualResult, result)
      } else if (typeof body !== 'undefined') {
        t.same(actualResult.Body, body)
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
  const bucket = createMemoizedBucket({
    bucket: bucketName,
    client,
    cache: new Cache({ maxAge: 500 })
  })

  await bucket.create()

  const ops: any[] = [
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
    const { method, args, result, body, cached, error } = op
    let getObjStub
    if (cached) {
      getObjStub = sandbox.stub(s3, 'getObject').callsFake(() => {
        t.fail('expected object to be cached')
      })
    }

    try {
      const actualResult = await bucket[method](...args)
      if (error) {
        t.fail(`expected error: ${error}`)
      } else if (typeof result !== 'undefined') {
        t.same(actualResult, result)
      } else if (typeof body !== 'undefined') {
        t.same(actualResult.Body, body)
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
  const bucket = createBucket({
    bucket: `test-${randomString(10)}`,
    client
  })

  await bucket.create()
  testKV({
    name: 's3 kv',
    create: () => createKVStore({ folder: bucket }),
    done: () => bucket.destroy()
  })
})()
