import crypto from 'crypto'
import { ShaEncoding } from './crypto'
export const randomStatementId = (base: string) => `${base}${crypto.randomBytes(6).toString('hex')}`
export const randomString = (lengthInBytes: number, enc: ShaEncoding = 'hex') =>
  crypto.randomBytes(lengthInBytes).toString(enc)
