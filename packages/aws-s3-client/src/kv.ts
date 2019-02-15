import { KeyValueStoreExtended } from '@tradle/aws-common-utils'
import { Folder } from './types'

export interface CreateGzippedStoreOpts {
  folder: Folder
}
export const createJsonKVStore = ({ folder }: CreateGzippedStoreOpts): KeyValueStoreExtended => {
  return {
    has: folder.has.bind(folder),
    get: folder.getJSON.bind(folder),
    del: folder.del.bind(folder),
    put: folder.put.bind(folder),
    sub: (prefix: string) =>
      createJsonKVStore({
        folder: folder.sub(prefix)
      })
  }
}
export const createGzippedJsonKVStore = ({ folder }: CreateGzippedStoreOpts): KeyValueStoreExtended => {
  return {
    has: folder.has.bind(folder),
    get: folder.getJSON.bind(folder),
    del: folder.del.bind(folder),
    put: folder.gzipAndPut.bind(folder),
    sub: (prefix: string) =>
      createGzippedJsonKVStore({
        folder: folder.sub(prefix)
      })
  }
}

// export interface CreateStoreOpts {
//   client: S3Client
//   prefix: string
//   defaultPutOpts?: Partial<AWS.S3.PutObjectRequest>
// }

// const parsePrefix = (prefix: string) => {
//   prefix.replace(/\/+$/, '')
//   const slashIdx = prefix.indexOf('/')
//   if (slashIdx === -1) {
//     return {
//       bucket: prefix,
//       keyPrefix: ''
//     }
//   }

//   return {
//     bucket: prefix.slice(0, slashIdx),
//     keyPrefix: prefix.slice(slashIdx + 1)
//   }
// }

// export const createStore = ({ client, prefix, defaultPutOpts = {} }: CreateStoreOpts): KeyValueStore => {
//   const { bucket, keyPrefix } = parsePrefix(prefix)
//   const getOptsForKey = key => ({
//     bucket,
//     key: keyPrefix ? `${keyPrefix}/${key}` : key
//   })

//   const get = async key => {
//     const { Body } = await client.get(getOptsForKey(key))
//     return Body
//   }

//   const put = async (key, value) => client.put({ ...getOptsForKey(key), ...defaultPutOpts, value })
//   const del = async key => {
//     await client.del(getOptsForKey(key))
//   }

//   const has = async key => client.exists(getOptsForKey(key))
//   return { get, put, del, has }
// }

// export const createGzippedStore = (opts: CreateStoreOpts): KeyValueStore => {
//   const { client, prefix, defaultPutOpts = {} } = opts
//   const { bucket, keyPrefix } = parsePrefix(prefix)
//   const getOptsForKey = key => ({
//     bucket,
//     key: keyPrefix ? `${keyPrefix}/${key}` : key
//   })

//   const store = createStore(opts)
//   const put = async (key, value) => {
//     await client.gzipAndPut({ ...getOptsForKey(key), ...defaultPutOpts, value })
//   }

//   return {
//     ...store,
//     put
//   }
// }
