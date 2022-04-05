import crypto from 'crypto'

export type ShaEncoding = 'latin1' | 'hex' | 'base64'

export const sha256 = (data: string | Buffer, enc: ShaEncoding) =>
  crypto
    .createHash('sha256')
    .update(data)
    .digest(enc)

export const sha256Hex = (data: string | Buffer) =>
  crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
