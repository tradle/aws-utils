import crypto, { HexBase64Latin1Encoding } from 'crypto'

type Encoding = 'hex' | 'base64' | 'binary'
export const sha256 = (data: string | Buffer, enc: HexBase64Latin1Encoding) =>
  crypto
    .createHash('sha256')
    .update(data)
    .digest(enc)

export const sha256Hex = (data: string | Buffer) =>
  crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
