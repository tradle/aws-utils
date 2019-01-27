import Errors from '@tradle/errors'

const NOT_FOUND_MATCH = [
  { name: 'NotFound' },
  { code: 'ResourceNotFoundException' },
  { code: 'NoSuchKey' },
  { code: 'NoSuchBucketPolicy' }
]

export const ignoreNotFound = err => Errors.ignore(err, NOT_FOUND_MATCH)
