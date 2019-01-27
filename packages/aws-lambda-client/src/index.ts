import AWS from 'aws-sdk'
import Errors from '@tradle/errors'
import { ClientFactory } from '@tradle/aws-client-factory'
import { randomStatementId, constants } from '@tradle/aws-common-utils'
import * as Types from './types'

export class LambdaClient {
  private clients: ClientFactory
  private lambda: AWS.Lambda
  // private logger: Logger
  constructor({ clients }: Types.ClientOpts) {
    this.clients = clients
    this.lambda = clients.lambda()
  }

  public invoke = async (opts: Types.InvokeOpts): Promise<any> => {
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
      service: constants.SERVICE_PRINCIPALS.sns,
      lambda
    })
  }

  public canServiceInvokeLambda = async ({ lambda, service }: Types.CanInvokeOpts) => {
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
}

export const createClient = (opts: Types.ClientOpts) => new LambdaClient(opts)
