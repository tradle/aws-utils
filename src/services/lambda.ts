import AWS from 'aws-sdk'
import * as Errors from '../errors'
import { Lambda, ClientFactory } from '../types'
import { randomStatementId } from '../utils/gen'
import { SERVICE_PRINCIPALS } from '../constants'
import { getRegionFromArn } from 'src/utils'
import { SNSClient } from './sns'

class LambdaClient {
  private clients: ClientFactory
  private lambda: AWS.Lambda
  // private logger: Logger
  constructor({ clients }: Lambda.ClientOpts) {
    this.clients = clients
    this.lambda = clients.lambda()
  }

  public invoke = async (opts: Lambda.InvokeOpts): Promise<any> => {
    const { name, arg = {}, sync = true, log, qualifier } = opts
    const params: AWS.Lambda.Types.InvocationRequest = {
      InvocationType: sync ? 'RequestResponse' : 'Event',
      FunctionName: name,
      Payload: JSON.stringify(arg)
    }

    if (log) params.LogType = 'Tail'
    if (qualifier) params.Qualifier = qualifier

    const { StatusCode, Payload, FunctionError } = await this.lambda.invoke(params).promise()
    if (FunctionError || (StatusCode && StatusCode >= 300)) {
      const message = Payload || `experienced ${FunctionError} error invoking lambda: ${name}`
      throw new Error(message.toString())
    }

    if (sync && Payload) {
      return JSON.parse(Payload.toString())
    }
  }

  public getConfiguration = (FunctionName: string): Promise<AWS.Lambda.Types.FunctionConfiguration> => {
    // this.logger.debug(`looking up configuration for ${FunctionName}`)
    return this.lambda.getFunctionConfiguration({ FunctionName }).promise()
  }

  public getPolicy = async (lambda: string) => {
    try {
      const { Policy } = await this.lambda.getPolicy({ FunctionName: lambda }).promise()
      return JSON.parse(Policy)
    } catch (err) {
      Errors.ignoreNotFound(err)
      throw new Errors.NotFound(`policy for lambda: ${lambda}`)
    }
  }

  public addPermission = async (params: AWS.Lambda.AddPermissionRequest) => {
    return await this.lambda.addPermission(params).promise()
  }

  public canSNSInvokeLambda = async (lambda: string): Promise<boolean> => {
    return this.canServiceInvokeLambda({
      service: SERVICE_PRINCIPALS.sns,
      lambda
    })
  }

  public canServiceInvokeLambda = async ({ lambda, service }: Lambda.CanInvokeOpts) => {
    let policy
    try {
      policy = await this.getPolicy(lambda)
    } catch (err) {
      Errors.ignoreNotFound(err)
    }

    if (policy) {
      return policy.Statement.some(s => s.Principal.Service === service)
    }

    return false
  }

  public allowSNSToInvoke = async (lambda: string) => {
    if (await this.canSNSInvokeLambda(lambda)) {
      return
    }

    // this.logger.debug('adding permission for sns to invoke lambda', { lambda })
    const params: AWS.Lambda.AddPermissionRequest = {
      FunctionName: lambda,
      Action: 'lambda:InvokeFunction',
      Principal: 'sns.amazonaws.com',
      StatementId: randomStatementId('allowSNSToInvokeLambda')
    }

    await this.addPermission(params)
  }

  public subscribeToTopic = async ({ topic, lambda, snsClient }: Lambda.SubscribeToTopicOpts) => {
    await this.allowSNSToInvoke(lambda)
    await snsClient.subscribe({
      protocol: 'lambda',
      topic,
      target: lambda
    })
  }
}

export { LambdaClient }
export const createLambdaClient = opts => new LambdaClient(opts)

const getMemorySize = (conf, provider) => {
  return conf.memorySize || provider.memorySize || 128
}

const getFunctionNameFromArn = (arn: string) => arn.slice(arn.lastIndexOf('function:') + 9)
