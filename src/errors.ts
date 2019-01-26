import Errors from '@tradle/errors'
export { rethrowAs } from '@tradle/errors'

export class UserError extends Error {
  public type = 'UserError'
}

export class NotFound extends Error {
  public type = 'NotFound'
}

export class InvalidOption extends UserError {
  public type = 'InvalidOption'
}

export class InvalidSignature extends UserError {
  public type = 'InvalidSignature'
}

export class NotImplemented extends Error {
  public type = 'NotImplemented'
}

export class Unsupported extends Error {
  public type = 'Unsupported'
}

export const getCurrentCallStack = (lineOffset: number = 2) =>
  new Error().stack
    .split('\n')
    .slice(lineOffset)
    .join('\n')

const NOT_FOUND_MATCH = [
  { name: 'NotFound' },
  { code: 'ResourceNotFoundException' },
  { code: 'NoSuchKey' },
  { code: 'NoSuchBucketPolicy' }
]

export const ignoreNotFound = err => Errors.ignore(err, NOT_FOUND_MATCH)
