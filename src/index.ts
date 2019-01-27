import { createSNSClient } from './services/sns'
import { createLambdaClient } from './services/lambda'
import * as utils from './utils'

export { utils }
export { createClientFactory } from './client-factory'
export { REGIONS as regions } from './constants'

export const services = {
  sns: createSNSClient,
  lambda: createLambdaClient
}

export * from './types'
