export interface ForEachItemInBucketOpts {
  bucket: string
  getBody?: boolean
  map: (item: any, index: number) => any
  [x: string]: any
}

export interface GetCacheableOpts {
  key: string
  bucket: string
  ttl: number
  parse?: (any) => any
  [x: string]: any
}

export interface BaseBucketOpts {
  bucket: string
}

export interface BaseObjectOpts extends BaseBucketOpts {
  key: string
}

export interface EnableEncryptionOpts {
  bucket: string
  kmsKeyId?: string
}

export interface BaseMultiKeyOpOpts extends BaseBucketOpts {
  keys: string[]
}

export interface SetPolicyForKeysOpts extends BaseMultiKeyOpOpts {
  policy: AWS.S3.ObjectCannedACL
}

export interface DeleteVersonsOpts extends BaseBucketOpts {
  versions: AWS.S3.ObjectVersionList
}

export interface BucketCopyOpts {
  source: string
  target: string
  prefix?: string
  keys?: string[]
  acl?: AWS.S3.ObjectCannedACL
}

export interface PutOpts extends BaseObjectOpts {
  value: any
  headers?: any
  acl?: AWS.S3.ObjectCannedACL
  [x: string]: any
}

export interface GetOpts extends BaseObjectOpts {
  [x: string]: any
}
