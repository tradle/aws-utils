import AWS, { DynamoDB } from 'aws-sdk'
import memoize from 'lodash/memoize'
import stableStringify from 'json-stable-stringify'
import { validateRegion } from './regions'
import { CreateClientsFactoryOpts } from './types'
import { services } from './service-ctors'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { APIVersions } from 'aws-sdk/lib/config'

type AnyFn = (...args: any[]) => any
type Wrap<T> = <T extends AnyFn>(func: T) => T

function getClient(serviceName: 'S3', opts?: AWS.S3.Types.ClientConfiguration): AWS.S3
function getClient(serviceName: 'DynamoDB', opts?: DynamoDB.Types.ClientConfiguration): AWS.DynamoDB
function getClient(
  serviceName: 'DynamoDB',
  opts?: DocumentClient.DocumentClientOptions & DynamoDB.Types.ClientConfiguration
): AWS.DynamoDB.DocumentClient
function getClient(serviceName: 'DynamoStreams', opts?: DynamoDB.Types.ClientConfiguration): AWS.DynamoDBStreams
function getClient(serviceName: 'IAM', opts?: AWS.IAM.Types.ClientConfiguration): AWS.IAM
function getClient(serviceName: 'Iot', opts?: AWS.Iot.Types.ClientConfiguration): AWS.Iot
function getClient(serviceName: 'STS', opts?: AWS.STS.Types.ClientConfiguration): AWS.STS
function getClient(serviceName: 'SNS', opts?: AWS.SNS.Types.ClientConfiguration): AWS.SNS
function getClient(serviceName: 'SQS', opts?: AWS.SQS.Types.ClientConfiguration): AWS.SQS
function getClient(serviceName: 'SES', opts?: AWS.SES.Types.ClientConfiguration): AWS.SES
function getClient(serviceName: 'KMS', opts?: AWS.KMS.Types.ClientConfiguration): AWS.KMS
function getClient(serviceName: 'Lambda', opts?: AWS.Lambda.Types.ClientConfiguration): AWS.Lambda
function getClient(serviceName: 'IotData', opts?: AWS.IotData.Types.ClientConfiguration): AWS.IotData
function getClient(serviceName: 'XRay', opts?: AWS.XRay.Types.ClientConfiguration): AWS.XRay
function getClient(serviceName: 'APIGateway', opts?: AWS.APIGateway.Types.ClientConfiguration): AWS.APIGateway
function getClient(serviceName: 'CloudWatch', opts?: AWS.CloudWatch.Types.ClientConfiguration): AWS.CloudWatch
function getClient(
  serviceName: 'CloudWatchLogs',
  opts?: AWS.CloudWatchLogs.Types.ClientConfiguration
): AWS.CloudWatchLogs
function getClient(serviceName: 'SSM', opts?: AWS.SSM.Types.ClientConfiguration): AWS.SSM
function getClient(
  serviceName: 'CloudFormation',
  opts?: AWS.CloudFormation.Types.ClientConfiguration
): AWS.CloudFormation

function getClient(serviceName: string, opts: ServiceConfigurationOptions & APIVersions = {}) {
  const Clazz = services[serviceName]
  return new Clazz(opts)
}

export type ClientFactory = typeof getClient

export const createClientFactory = (clientsOpts: CreateClientsFactoryOpts) => {
  const { defaults } = clientsOpts
  const { region } = defaults

  validateRegion(region)
  AWS.config.update(defaults)

  // @ts-ignore
  const memoized = memoize(
    (serviceName, opts) => {
      const client = getClient(serviceName, { ...defaults, ...opts })
      if (clientsOpts.useGlobalConfigClock) {
        useGlobalConfigClock(client)
      }

      return client
    },
    (serviceName, opts) => stableStringify({ serviceName, opts })
  ) as ClientFactory

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
