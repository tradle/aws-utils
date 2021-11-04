import * as Errors from '@tradle/errors'

const NOT_FOUND_MATCH = [
  { name: 'NotFound' },
  { code: 'ResourceNotFoundException' },
  { code: 'NoSuchKey' },
  { code: 'NoSuchBucketPolicy' }
]

const ignoreNotFound = (err: any) => Errors.ignore(err, NOT_FOUND_MATCH)

class BatchOpError extends Error {
  constructor(message: string, public errors: Error[] = []) {
    super(message)
  }
}

export = {
  ...Errors,
  ignoreNotFound,
  BatchOpError
}
