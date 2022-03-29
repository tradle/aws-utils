import test from 'tape'
import { getAWSRegionByCallingCode, parseE164 } from '../geo'
import { E164 } from '../types'
import { InvalidOption } from '@tradle/errors'

test('parse a phone number', async t => {
  t.deepEquals(parseE164('+81804131'), new E164('81', '804131'), 'Regular two character country prefix')
  t.deepEquals(parseE164('123415151'), new E164('1234', '15151'), 'US long country code')
  t.deepEquals(parseE164('+358181234'), new E164('35818', '1234'), 'Åland Islands long IDD')
  t.deepEquals(parseE164('+39066981'), new E164('3906698', '1'), 'Vaticans very long IDD')
  t.deepEquals(parseE164(' + 81 80 02\t3813'), new E164('81', '80023813'), 'spaces and tabs are removed')
  t.throws(() => parseE164('+991991'), InvalidOption)
})

test('E164 serializtion', async t => {
  const callingCode = '81'
  const number = '804131'
  const e164 = new E164(callingCode, number)
  t.equals(e164.callingCode, callingCode)
  t.equals(e164.number, number)
  t.equals(e164.toString(), `+${callingCode}${number}`)
  t.deepEquals(e164.toJSON(), { callingCode, number })
})

test('get aws region for calling code', async t => {
  t.deepEquals(getAWSRegionByCallingCode('385'), 'eu-south-1')
  t.deepEquals(getAWSRegionByCallingCode('1201'), 'us-east-2')
  t.deepEquals(getAWSRegionByCallingCode('9999'), 'us-east-1')
})
