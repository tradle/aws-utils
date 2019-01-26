export { createClientFactory } from './client-factory'
export { regions } from './regions'
import { createSNSClient } from './services/sns'
import { createLambdaClient } from './services/lambda'

export const services = {
  sns: createSNSClient,
  lambda: createLambdaClient
}
