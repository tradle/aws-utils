import Errors from '@tradle/errors'
export { ignore, match, rethrow, NotFound } from '@tradle/errors'

const NOT_FOUND_MATCH = [
  { name: 'NotFound' },
  { code: 'ResourceNotFoundException' },
  { code: 'NoSuchKey' },
  { code: 'NoSuchBucketPolicy' }
]

export const ignoreNotFound = err => Errors.ignore(err, NOT_FOUND_MATCH)

export const BatchOpError = Errors.createError('BatchOpError')
