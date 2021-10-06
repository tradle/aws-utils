import AWS from 'aws-sdk'
import { S3 } from 'aws-sdk'
import { Omit, IAMStatement } from '@tradle/aws-common-utils'
import { S3Client } from './client'
export { Bucket, Folder } from './bucket'

export interface BucketOpts {
  bucket: string
  client: S3Client
  prefix?: string
}

export type ListOptsMinusBucket = Omit<AWS.S3.ListObjectsV2Request, 'Bucket'>

export interface ListBucketOpts extends BaseBucketOpts {
  getBody?: boolean
  s3Opts?: ListOptsMinusBucket
}

export interface ForEachItemInBucketOpts extends ListBucketOpts {
  map: (item: any, index: number) => any
  // [x: string]: any
}

export interface ForEachItemInBucketWithPrefixOpts extends BaseBucketOpts {
  prefix: string
  getBody?: boolean
  s3Opts?: ListOptsMinusBucket
}
export interface GetCacheableOpts extends GetOpts {
  ttl: number
  parse?: (any) => any
}

export interface BaseBucketOpts {
  bucket: string
}

export interface BaseObjectOpts extends BaseBucketOpts {
  key: string,
  region?: string
}

export interface EnableEncryptionOpts extends BaseBucketOpts {
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
  s3Opts?: Partial<AWS.S3.GetObjectRequest>
}

export interface BucketPolicy {
  Statement: IAMStatement[]
}

export interface S3ObjWithBody extends S3.Object {
  Body: S3.Body
}

export interface CopyFilesToOpts {
  bucket: string
  keys?: string[]
  prefix?: string
  acl?: AWS.S3.ObjectCannedACL
}
