export const alphabetical = (a, b) => {
  if (a === b) return 0
  if (a < b) return -1
  return 1
}

export const toStringOrBuf = value => {
  if (typeof value === 'string') return value
  if (Buffer.isBuffer(value)) return value
  if (!value) throw new Error('expected string, Buffer, or stringifiable object')

  return JSON.stringify(value)
}
