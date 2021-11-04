export const alphabetical = (a: any, b: any): 0 | 1 | -1 => {
  if (a === b) return 0
  if (a < b) return -1
  return 1
}

export const toStringOrBuf = (value: any) => {
  if (typeof value === 'string') return value
  if (Buffer.isBuffer(value)) return value
  if (!value) throw new Error('expected string, Buffer, or stringifiable object')

  return JSON.stringify(value)
}

export const parseS3Path = (path: string) => {
  const idx = path.indexOf('/')
  const key = path.slice(idx + 1)
  return {
    bucket: path.slice(0, idx),
    key: key || undefined
  }
}
