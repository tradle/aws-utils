import { InvalidOption } from '@tradle/errors'
import { countries, Country } from '@tradle/aws-common-utils'
import { E164 } from './types'

// https://stackoverflow.com/questions/6478875/regular-expression-matching-e-164-formatted-phone-numbers
const E164_REGEX = /^\+?([1-9]\d{1,14})$/
export const DEFAULT_REGION = 'us-east-1'

const callingCodeMap: { [callingCode: string]: Country } = {}
let longestCallingCode: number = 0
for (const country of Object.values(countries)) {
  for (const callingCode of country.callingCodes) {
    callingCodeMap[callingCode] = country
    longestCallingCode = Math.max(longestCallingCode, callingCode.length)
  }
}

export function getAWSRegionByCallingCode (callingCode: string) {
  const country = callingCodeMap[callingCode]
  return country && country.sms && country.sms.region || DEFAULT_REGION
}

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
  for (let i = Math.min(longestCallingCode, digits.length); i > 0; i--) {
    const candidate = digits.substr(0, i)
    if (callingCodeMap[candidate]) {
      callingCode = candidate
      break
    }
  }
  if (callingCode === undefined) {
    throw new InvalidOption(`No known calling code for: ${phoneNumber}`)
  }

  return new E164(callingCode, digits.slice(callingCode.length))
}

export function getAWSRegionByPhoneNumber (phone: string | E164) {
  try {
    const { callingCode } = parseE164(phone)
    return getAWSRegionByCallingCode(callingCode)
  } catch (err) {
    return DEFAULT_REGION
  }
}
