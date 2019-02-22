import { KeyValueStoreExtended } from '@tradle/aws-common-utils'
import { Folder } from './types'

const noParse = str => str
const parseJSON = str => JSON.parse(str)

export interface CreateStoreOpts {
  folder: Folder
  parse?: (raw: string) => any
}

export const createKVStore = ({ folder, parse = noParse }: CreateStoreOpts): KeyValueStoreExtended => {
  return {
    has: folder.has.bind(folder),
    get: (key: string) => folder.get(key).then(({ Body }) => parse(Body.toString())),
    del: folder.del.bind(folder),
    put: folder.put.bind(folder),
    sub: (prefix: string) =>
      createKVStore({
        folder: folder.sub(prefix),
        parse
      })
  }
}

export const createJsonKVStore = (opts: CreateStoreOpts) => createKVStore({ parse: parseJSON, ...opts })

export const createGzippedKVStore = (opts: CreateStoreOpts): KeyValueStoreExtended => {
  const { folder } = opts
  return {
    ...createKVStore(opts),
    put: folder.gzipAndPut.bind(folder),
    sub: (prefix: string) =>
      createGzippedKVStore({
        ...opts,
        folder: folder.sub(prefix)
      })
  }
}

export const createGzippedJsonKVStore = (opts: CreateStoreOpts): KeyValueStoreExtended =>
  createGzippedKVStore({
    ...opts,
    parse: parseJSON
  })

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
