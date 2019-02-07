import * as Errors from '@tradle/errors'

const NOT_FOUND_MATCH = [
  { name: 'NotFound' },
  { code: 'ResourceNotFoundException' },
  { code: 'NoSuchKey' },
  { code: 'NoSuchBucketPolicy' }
]

const ignoreNotFound = err => Errors.ignore(err, NOT_FOUND_MATCH)

class BatchOpError extends Error {
  constructor(message, public errors: Error[] = []) {
    super(message)
  }
}

export = {
  ...Errors,
  ignoreNotFound,
  BatchOpError
}
