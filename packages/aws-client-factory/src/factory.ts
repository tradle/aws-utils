import _ from 'lodash'
import stableStringify from 'json-stable-stringify'
import { mergeIntoAWSConfig, AWSSDK, FirstArgument } from '@tradle/aws-common-utils'
import { EventEmitter } from 'events'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'

export type DocumentClientOptions = AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration

type BaseFactory = ReturnType<typeof createBaseFactory>
type CreateClientFactoryDefaults = {
  [key in keyof BaseFactory]: FirstArgument<BaseFactory[key]>
} & {
  region: string,
  common: ServiceConfigurationOptions
}

export interface CreateClientsFactoryOpts {
  AWS: AWSSDK
  defaults?: Partial<CreateClientFactoryDefaults>
  useGlobalConfigClock?: boolean
}

const createBaseFactory = (AWS: AWSSDK) => ({
  s3: (opts: AWS.S3.Types.ClientConfiguration = {}) => new AWS.S3(opts),
  dynamodb: (opts: AWS.DynamoDB.Types.ClientConfiguration = {}) => new AWS.DynamoDB(opts),
  documentclient: (opts: DocumentClientOptions = {}) => new AWS.DynamoDB.DocumentClient(opts),
  dynamodbstreams: (opts: AWS.DynamoDBStreams.Types.ClientConfiguration = {}) => new AWS.DynamoDBStreams(opts),
  iam: (opts: AWS.IAM.Types.ClientConfiguration = {}) => new AWS.IAM(opts),
  iot: (opts: AWS.Iot.Types.ClientConfiguration = {}) => new AWS.Iot(opts),
  sts: (opts: AWS.STS.Types.ClientConfiguration = {}) => new AWS.STS(opts),
  sns: (opts: AWS.SNS.Types.ClientConfiguration = {}) => new AWS.SNS(opts),
  sqs: (opts: AWS.SQS.Types.ClientConfiguration = {}) => new AWS.SQS(opts),
  ses: (opts: AWS.SES.Types.ClientConfiguration = {}) => new AWS.SES(opts),
  kms: (opts: AWS.KMS.Types.ClientConfiguration = {}) => new AWS.KMS(opts),
  organizations: (opts: AWS.Organizations.ClientConfiguration = {}) => new AWS.Organizations(opts),
  lambda: (opts: AWS.Lambda.Types.ClientConfiguration = {}) => new AWS.Lambda(opts),
  iotdata: (opts: AWS.IotData.Types.ClientConfiguration = {}) => new AWS.IotData(opts),
  xray: (opts: AWS.XRay.Types.ClientConfiguration = {}) => new AWS.XRay(opts),
  apigateway: (opts: AWS.APIGateway.Types.ClientConfiguration = {}) => new AWS.APIGateway(opts),
  cloudwatch: (opts: AWS.CloudWatch.Types.ClientConfiguration = {}) => new AWS.CloudWatch(opts),
  cloudwatchlogs: (opts: AWS.CloudWatchLogs.Types.ClientConfiguration = {}) => new AWS.CloudWatchLogs(opts),
  cloudformation: (opts: AWS.CloudFormation.Types.ClientConfiguration = {}) => new AWS.CloudFormation(opts),
  textract: (opts: AWS.Textract.Types.ClientConfiguration = {}) => new AWS.Textract(opts)
})

type BareClientCache = {
  [key in keyof BaseFactory]: ReturnType<BaseFactory[key]>
}

type ForEachClientCallback = <K extends keyof BareClientCache, V = BareClientCache[K]>(
  client: V,
  serviceName: K
) => void

export interface ClientCache extends BareClientCache {
  factory: ClientFactory
  instantiated: Partial<ClientCache>
  events: EventEmitter
  forEach: (fn: ForEachClientCallback) => void
}

export interface ClientFactory extends ReturnType<typeof createBaseFactory> {
  events: EventEmitter
}

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any

const FACTORY_DEFAULTS = {
  region: process.env.AWS_REGION
}

export const createClientFactory = (clientsOpts: CreateClientsFactoryOpts) => {
  let { AWS, defaults:def = FACTORY_DEFAULTS } = clientsOpts

  const defaults = def as CreateClientFactoryDefaults

  // hm...it's kind of crazy to modify a global config here
  mergeIntoAWSConfig(AWS, defaults)

  const factory = createBaseFactory(AWS)
  const events = new EventEmitter()
  const memoized = {
    events: new EventEmitter()
  } as ClientFactory
  _.functions(factory).forEach((serviceName) => {
    const name = serviceName as keyof typeof factory
    memoized[name] = _.memoize(
      (opts: any) => {
        const commonDefaults: any = defaults.common ?? {}
        const serviceDefaults: any = defaults[name] ?? {}
        const finalOpts = {
          ...commonDefaults,
          ...serviceDefaults,
          ...opts
        }
        const client = factory[name](finalOpts)
        if (clientsOpts.useGlobalConfigClock) {
          useGlobalConfigClock(AWS, client)
        }

        events.emit('new', { name, recordable: client })
        return client
      },
      (opts: any) => stableStringify(opts)
    ) as any
  })

  return memoized
}

export const createClientCache = (clientOpts: CreateClientsFactoryOpts) => {
  const factory = createClientFactory(clientOpts)
  // @ts-ignore
  const cache = { events: factory.events } as ClientCache

  const instantiated = {} as Partial<ClientCache>
  const clientNames = _.functions(factory) as [keyof BareClientCache]
  clientNames.forEach(method => {
    Object.defineProperty(cache, method, {
      set(value) {
        instantiated[method] = value
      },
      get() {
        if (!instantiated[method]) {
          // @ts-ignore
          instantiated[method] = factory[method]()
        }

        return instantiated[method]
      }
    })
  })

  cache.factory = factory
  cache.instantiated = instantiated
  cache.forEach = fn => clientNames.forEach(key => fn(cache[key], key))
  return cache
}

export const useGlobalConfigClock = (AWS: AWSSDK, service: AWS.Service | AWS.DynamoDB.DocumentClient) => {
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
