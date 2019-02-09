import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import stableStringify from 'json-stable-stringify'
import { isPromise } from '@tradle/promise-utils'
import { Logger } from './logger'

export interface GetPutDel {
  get: (key: any) => Promise<any>
  put: (key: any, value: any, ...opts: any[]) => Promise<any | void>
  del: (key: any) => Promise<any | void>
}

export interface Cache {
  get: (key: any) => any
  set: (key: any, value: any) => void
  del: (key: any) => void
}

export interface CachifyOpts extends GetPutDel {
  cache: Cache
  logger?: Logger
  cloneOnGet?: boolean
}

export const cachify = ({ get, put, del, logger, cache, cloneOnGet }: CachifyOpts) => {
  const maybeClone = cloneOnGet ? cloneDeep : obj => obj
  const cachified = {} as GetPutDel
  cachified.get = async key => {
    const keyStr = stableStringify(key)
    let val = cache.get(keyStr)
    if (val != null) {
      if (logger) logger.silly(`cache hit`, { key })
      // val might be a promise
      // the magic of co should resolve it
      // before returning
      if (isPromise(val)) {
        try {
          val = await val
        } catch (err) {
          // refetch on error
          return cachified.get(key)
        }
      }

      return maybeClone(val)
    }

    if (logger) logger.silly(`cache miss`, { key })
    const promise = get(key)
    promise.catch(err => cache.del(keyStr))
    cache.set(keyStr, promise)
    // promise.then(result => cache.set(keyStr, result))
    return promise.then(maybeClone)
  }

  cachified.del = async key => {
    const keyStr = stableStringify(key)
    if (logger) logger.silly('cache unset', { key })
    cache.del(keyStr)
    return await del(key)
  }

  cachified.put = async (key, value, ...rest) => {
    // TODO (if actually needed):
    // get cached value, skip put if identical
    if (logger) logger.silly('cache set', { key })

    const keyStr = stableStringify(key)
    if (logger && cache.has(keyStr)) {
      logger.warn(`cache already has value for ${key}, put may not be necessary`)
      if (isEqual(cache.get(keyStr), value)) {
        return
      }
    }

    cache.del(keyStr)
    await put(key, value, ...rest)
    cache.set(keyStr, value)
  }

  return cachified
}
