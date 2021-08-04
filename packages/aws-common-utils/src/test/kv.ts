import test from 'tape'
import { KeyValueStoreExtended } from '../types'

const noop = () => {}
export const testKV = ({ name, create, done = noop }) =>
  test(`key-value table (${name})`, async t => {
    const kv = create() as KeyValueStoreExtended
    t.equal(await kv.has('a'), false)
    await kv.put('a', {
      b: 'c',
      age: 75,
      _time: 123
    })

    t.equal(await kv.has('a'), true)
    t.same(await kv.get('a'), {
      b: 'c',
      age: 75,
      _time: 123
    })

    // if (kv instanceof KV) {
    //   await kv.update("a", {
    //     UpdateExpression: "SET #age = #age + :incr",
    //     ExpressionAttributeNames: {
    //       "#age": "age"
    //     },
    //     ExpressionAttributeValues: {
    //       ":incr": 1
    //     },
    //     ReturnValues: "UPDATED_NEW"
    //   })
    // } else if (kv.update) {
    //   await kv.update("a", {
    //     UpdateExpression: "SET #value.#age = #value.#age + :incr",
    //     ExpressionAttributeNames: {
    //       "#value": "value",
    //       "#age": "age"
    //     },
    //     ExpressionAttributeValues: {
    //       ":incr": 1
    //     },
    //     ReturnValues: "UPDATED_NEW"
    //   })
    // } else {
    //   await kv.put("a", {
    //     ...(await kv.get("a")),
    //     age: 76
    //   })
    // }

    // t.same((await kv.get('a')).age, 76)

    if (!kv.sub) return done()

    const sub = kv.sub('mynamespace:')
    t.equal(await sub.has('a'), false)
    try {
      await sub.get('mynamespace:a')
      t.fail('sub should not have value')
    } catch (err) {
      t.ok(err)
    }

    await sub.put('a', {
      d: 'e',
      _time: 123
    })

    t.equal(await sub.has('a'), true)
    t.same(await sub.get('a'), {
      d: 'e',
      _time: 123
    })

    t.equal(await kv.has('mynamespace:a'), true)
    t.same(await kv.get('mynamespace:a'), {
      d: 'e',
      _time: 123
    })

    await sub.del('a')
    t.equal(await sub.has('a'), false)
    try {
      await sub.get('a')
      t.fail('sub should not have value')
    } catch (err) {
      t.ok(err)
    }

    done()
  })
