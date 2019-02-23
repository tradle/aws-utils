import AWS from 'aws-sdk'
import { Logger } from './logger'
export type AWSSDK = typeof AWS
export type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any ? U : any
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>

export type OmitFromFirstArg<T, K extends keyof T> = Omit<FirstArgument<T>, K>

export interface KeyValueStore {
  get: (key: string, opts?: any) => Promise<any>
  put: (key: string, value: any, opts?: any) => Promise<void | any>
  del: (key: string, opts?: any) => Promise<void>
}

export interface HasHas {
  has: (key: string) => Promise<boolean>
}

export interface HasSub<T> {
  sub: (key: string) => T
}

export interface KeyValueStoreExtended extends KeyValueStore, HasHas, HasSub<KeyValueStoreExtended> {}

export interface Cache {
  has: (key: any) => boolean
  get: (key: any) => any
  set: (key: any, value: any) => void
  del: (key: any) => void
}

export interface CachifyOpts extends KeyValueStore {
  cache: Cache
  logger?: Logger
  cloneOnGet?: boolean
}

export interface AWSConfig extends FirstArgument<AWS.Config['update']> {
  region: string
}

// IAM

export interface IAMPrincipalObj {
  AWS: string | string[]
}
export type IAMPrincipal = string | IAMPrincipalObj

export interface IAMStatement {
  Principal: IAMPrincipal
  Action: string | string[]
  Resource: string | string[]
  [x: string]: any
}
