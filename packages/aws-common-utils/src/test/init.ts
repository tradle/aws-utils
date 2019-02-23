import { targetLocalstack } from '../target-localstack'
import { AWSSDK } from '../types'
export const initTest = (AWS: AWSSDK) => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('expected NODE_ENV=test')
  }

  require('source-map-support').install()
  targetLocalstack(AWS)
}
