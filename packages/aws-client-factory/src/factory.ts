import _ from 'lodash'
import stableStringify from 'json-stable-stringify'
import { mergeIntoAWSConfig, AWSSDK } from '@tradle/aws-common-utils'
import { EventEmitter } from 'events'

export interface CreateClientFactoryDefaults extends AWS.ConfigService.ClientConfiguration {
  region: string
}

export interface CreateClientsFactoryOpts {
  AWS: AWSSDK
  defaults?: CreateClientFactoryDefaults
  useGlobalConfigClock?: boolean
}

const createBaseFactory = (AWS: AWSSDK) => ({
  s3: (opts: AWS.S3.Types.ClientConfiguration = {}) => new AWS.S3(opts),
  dynamodb: (opts: AWS.DynamoDB.Types.ClientConfiguration = {}) => new AWS.DynamoDB(opts),
  documentclient: (
    opts: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {}
  ) => new AWS.DynamoDB.DocumentClient(opts),
  dynamodbstreams: (opts: AWS.DynamoDBStreams.Types.ClientConfiguration = {}) => new AWS.DynamoDBStreams(opts),
  iam: (opts: AWS.IAM.Types.ClientConfiguration = {}) => new AWS.IAM(opts),
  iot: (opts: AWS.Iot.Types.ClientConfiguration = {}) => new AWS.Iot(opts),
  sts: (opts: AWS.STS.Types.ClientConfiguration = {}) => new AWS.STS(opts),
  sns: (opts: AWS.SNS.Types.ClientConfiguration = {}) => new AWS.SNS(opts),
  sqs: (opts: AWS.SQS.Types.ClientConfiguration = {}) => new AWS.SQS(opts),
  ses: (opts: AWS.SES.Types.ClientConfiguration = {}) => new AWS.SES(opts),
  kms: (opts: AWS.KMS.Types.ClientConfiguration = {}) => new AWS.KMS(opts),
  lambda: (opts: AWS.Lambda.Types.ClientConfiguration = {}) => new AWS.Lambda(opts),
  iotdata: (opts: AWS.IotData.Types.ClientConfiguration = {}) => new AWS.IotData(opts),
  xray: (opts: AWS.XRay.Types.ClientConfiguration = {}) => new AWS.XRay(opts),
  apigateway: (opts: AWS.APIGateway.Types.ClientConfiguration = {}) => new AWS.APIGateway(opts),
  cloudwatch: (opts: AWS.CloudWatch.Types.ClientConfiguration = {}) => new AWS.CloudWatch(opts),
  cloudwatchlogs: (opts: AWS.CloudWatchLogs.Types.ClientConfiguration = {}) => new AWS.CloudWatchLogs(opts),
  cloudformation: (opts: AWS.CloudFormation.Types.ClientConfiguration = {}) => new AWS.CloudFormation(opts),
  events: new EventEmitter()
})

export interface ClientCache extends EventEmitter {
  s3: AWS.S3
  dynamodb: AWS.DynamoDB
  documentclient: AWS.DynamoDB.DocumentClient
  dynamodbstreams: AWS.DynamoDBStreams
  iam: AWS.IAM
  iot: AWS.Iot
  sts: AWS.STS
  sns: AWS.SNS
  sqs: AWS.SQS
  ses: AWS.SES
  kms: AWS.KMS
  lambda: AWS.Lambda
  iotdata: AWS.IotData
  xray: AWS.XRay
  apigateway: AWS.APIGateway
  cloudwatch: AWS.CloudWatch
  cloudwatchlogs: AWS.CloudWatchLogs
  cloudformation: AWS.CloudFormation
  factory: ClientFactory
  instantiated: Partial<ClientCache>
  events: EventEmitter
}

export interface ClientFactory extends ReturnType<typeof createBaseFactory>, EventEmitter {}

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any

const FACTORY_DEFAULTS = {
  region: process.env.AWS_REGION
}

export const createClientFactory = (clientsOpts: CreateClientsFactoryOpts) => {
  const { AWS, defaults = FACTORY_DEFAULTS } = clientsOpts

  // hm...it's kind of crazy to modify a global config here
  mergeIntoAWSConfig(AWS, defaults)

  const factory = createBaseFactory(AWS)
  const memoized = { events: factory.events } as ClientFactory
  _.functions(factory).forEach(serviceName => {
    memoized[serviceName] = _.memoize(
      opts => {
        const serviceDefaults = defaults[serviceName] || {}
        const client = factory[serviceName]({ ...serviceDefaults, ...opts })
        if (clientsOpts.useGlobalConfigClock) {
          useGlobalConfigClock(AWS, client)
        }

        memoized.events.emit('new', { name: serviceName, recordable: client })
        return client
      },
      opts => stableStringify(opts)
    )
  })

  return memoized
}

export const createClientCache = (clientOpts: CreateClientsFactoryOpts) => {
  const factory = createClientFactory(clientOpts)
  // @ts-ignore
  const cache = { events: factory.events } as ClientCache

  const instantiated = {} as Partial<ClientCache>
  _.functions(factory).forEach(method => {
    Object.defineProperty(cache, method, {
      get() {
        return (instantiated[method] = factory[method]())
      }
    })
  })

  cache.factory = factory
  cache.instantiated = instantiated
  return cache
}

export const useGlobalConfigClock = (AWS, service: AWS.Service) => {
  if (service instanceof AWS.DynamoDB.DocumentClient) {
    // @ts-ignore
    service = (service as AWS.DynamoDB.DocumentClient).service as AWS.DynamoDB
  }

  if (!service.config) return

  Object.defineProperty(service.config, 'systemClockOffset', {
    get() {
      return AWS.config.systemClockOffset
    },
    set(value) {
      AWS.config.systemClockOffset = value
    }
  })
}
