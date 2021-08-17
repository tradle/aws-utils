import test from 'tape'
import { getAWSRegionByCallingCode, parseE164 } from '../geo'
import { InvalidOption } from '@tradle/errors'

test('parse a phone number', async t => {
  t.deepEquals(parseE164('+81804131'), {
    callingCode: '81',
    number: '804131'
  }, 'Regular two character country prefix')
  t.deepEquals(parseE164('123415151'), {
    callingCode: '1234',
    number: '15151'
  }, 'US long country code')
  t.deepEquals(parseE164('+358181234'), {
    callingCode: '35818',
    number: '1234'
  }, 'Åland Islands long IDD')
  t.deepEquals(parseE164('+39066981'), {
    callingCode: '3906698',
    number: '1'
  }, 'Vaticans very long IDD')
  t.throws(() => parseE164('+991991'), InvalidOption)
})

test('get aws region for calling code', async t => {
  t.deepEquals(getAWSRegionByCallingCode('385'), 'eu-central-1')
  t.deepEquals(getAWSRegionByCallingCode('1201'), 'us-east-2')
  t.deepEquals(getAWSRegionByCallingCode('9999'), 'us-east-1')
})
