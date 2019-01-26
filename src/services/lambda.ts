import AWS from 'aws-sdk'
import * as Errors from '../errors'
import { Lambda, ClientFactory } from '../types'
import { genStatementId } from '../utils/gen'

class LambdaClient {
  private getClient: ClientFactory
  private lambda: AWS.Lambda
  // private logger: Logger
  constructor({ getClient }: Lambda.ClientOpts) {
    this.getClient = getClient
    this.lambda = getClient('Lambda')
  }

  public invoke = async (opts: {
    name: string
    arg?: any
    sync?: boolean
    log?: boolean
    qualifier?: string
  }): Promise<any> => {
    let { name, arg = {}, sync = true, log, qualifier } = opts

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

  public canSNSInvoke = async (lambda: string): Promise<boolean> => {
    let policy
    try {
      policy = await this.getPolicy(lambda)
    } catch (err) {
      Errors.ignoreNotFound(err)
    }

    if (policy) {
      return policy.Statement.some(({ Principal }) => {
        return Principal.Service === 'sns.amazonaws.com'
      })
    }

    return false
  }

  public allowSNSToInvoke = async (lambda: string) => {
    // this.logger.debug('adding permission for sns to invoke lambda', { lambda })
    const params: AWS.Lambda.AddPermissionRequest = {
      FunctionName: lambda,
      Action: 'lambda:InvokeFunction',
      Principal: 'sns.amazonaws.com',
      StatementId: genStatementId('allowSNSToInvokeLambda')
    }

    await this.addPermission(params)
  }
}

export { LambdaClient }
export const createLambdaClient = opts => new LambdaClient(opts)

const getMemorySize = (conf, provider) => {
  return conf.memorySize || provider.memorySize || 128
}

const getFunctionNameFromArn = (arn: string) => arn.slice(arn.lastIndexOf('function:') + 9)
