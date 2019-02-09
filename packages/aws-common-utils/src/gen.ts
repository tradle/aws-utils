import crypto, { HexBase64BinaryEncoding } from 'crypto'
export const randomStatementId = (base: string) => `${base}${crypto.randomBytes(6).toString('hex')}`
export const randomString = (lengthInBytes: number, enc: HexBase64BinaryEncoding) =>
  crypto.randomBytes(lengthInBytes).toString(enc)
