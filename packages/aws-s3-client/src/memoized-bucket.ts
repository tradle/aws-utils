import { cachify, Logger } from '@tradle/aws-common-utils'
import { BucketOpts } from './types'
import { createBucket as createBaseBucket, Bucket } from './bucket'

export interface MemoizedBucketOpts extends BucketOpts {
  cache: any // lru-cache
  logger?: Logger
}

export class MemoizedBucket extends Bucket {
  private cache: any
  constructor({ cache, logger, ...opts }: MemoizedBucketOpts) {
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

export const createMemoizedBucket = (opts: MemoizedBucketOpts) => new MemoizedBucket(opts)
