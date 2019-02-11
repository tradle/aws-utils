import { targetLocalstack } from '../target-localstack'

export const initTest = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('expected NODE_ENV=test')
  }

  require('source-map-support').install()
  targetLocalstack()
}
