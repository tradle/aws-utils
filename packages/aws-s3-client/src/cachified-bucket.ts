import { cachify, Logger } from '@tradle/aws-common-utils'
import { BucketOpts } from './types'
import { createBucket as createBaseBucket, Bucket } from './bucket'

export interface CachifiedBucketOpts extends BucketOpts {
  cache: any // lru-cache
  logger?: Logger
}

export class CachifiedBucket extends Bucket {
  private cache: any
  constructor({ cache, logger, ...opts }: CachifiedBucketOpts) {
    super(opts)
    this.cache = cache
    const cachified = cachify({
      get: this.getJSON,
      put: this.put,
      del: this.del,
      logger,
      cache,
      cloneOnGet: true
    })

    this.getJSON = cachified.get
    this.putJSON = cachified.put
    this.del = cachified.del
  }
}

export const createBucket = (opts: CachifiedBucketOpts) => new CachifiedBucket(opts)
