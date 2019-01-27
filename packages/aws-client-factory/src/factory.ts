import AWS from 'aws-sdk'
import memoize from 'lodash/memoize'
import transform from 'lodash/transform'
import stableStringify from 'json-stable-stringify'

export interface CreateClientFactoryDefaults extends AWS.ConfigService.ClientConfiguration {
  region: string
}

export interface CreateClientsFactoryOpts {
  defaults: CreateClientFactoryDefaults
  useGlobalConfigClock: boolean
}

export interface AWSClientOpts {
  clients: ClientFactory
}

const factories = {
  s3: (opts: AWS.S3.Types.ClientConfiguration = {}) => new AWS.S3(opts),
  dynamodb: (opts: AWS.DynamoDB.Types.ClientConfiguration = {}) => new AWS.DynamoDB(opts),
  documentclient: (opts: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration) =>
    new AWS.DynamoDB.DocumentClient(opts),
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
  cloudformation: (opts: AWS.CloudFormation.Types.ClientConfiguration = {}) => new AWS.CloudFormation(opts)
}

export type ClientFactory = typeof factories

export const createClientFactory = (clientsOpts: CreateClientsFactoryOpts) => {
  const { defaults } = clientsOpts
  const { region } = defaults

  AWS.config.update(defaults)

  const memoized = transform(
    factories,
    (memFactories, value, serviceName) => {
      memFactories[serviceName] = memoize(
        opts => {
          const client = factories[serviceName]({ ...defaults, ...opts })
          if (clientsOpts.useGlobalConfigClock) {
            useGlobalConfigClock(client)
          }

          return client
        },
        opts => stableStringify(opts)
      )
    },
    {}
  ) as typeof factories

  return memoized
}

export const useGlobalConfigClock = (service: AWS.Service) => {
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
