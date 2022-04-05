import { InvalidOption } from '@tradle/errors'
import { info } from '@tradle/aws-common-utils'
import { E164 } from './types'

// https://stackoverflow.com/questions/6478875/regular-expression-matching-e-164-formatted-phone-numbers
const E164_REGEX = /^\+?([1-9]\d{1,14})$/
export const DEFAULT_REGION = 'us-east-1'

export function parseE164 (phoneNumber: string | E164) {
  if (phoneNumber instanceof E164) {
    return phoneNumber
  }
  const parts = phoneNumber.replace(/\s+/g, '').match(E164_REGEX)
  if (parts === null) {
    throw new InvalidOption(`Phone number without digits: ${phoneNumber}`)
  }
  const digits = parts[1]
  let callingCode: string | undefined
  for (let i = Math.min(info.longestCallingCode, digits.length); i > 0; i--) {
    const candidate = digits.substring(0, i)
    if (info.countryByCallingCode[candidate]) {
      callingCode = candidate
      break
    }
  }
  if (callingCode === undefined) {
    throw new InvalidOption(`No known calling code for: ${phoneNumber}`)
  }

  return new E164(callingCode, digits.slice(callingCode.length))
}
