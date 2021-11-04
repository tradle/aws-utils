import AWS from 'aws-sdk'
import { Errors, randomStatementId, constants } from '@tradle/aws-common-utils'
import * as Types from './types'

export class LambdaClient {
  private client: AWS.Lambda
  // private logger: Logger
  constructor({ client }: Types.ClientOpts) {
    this.client = client
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

    const { StatusCode, Payload, FunctionError } = await this.client.invoke(params).promise()
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
    return this.client.getFunctionConfiguration({ FunctionName }).promise()
  }

  public getPolicy = async (lambda: string) => {
    try {
      const { Policy } = await this.client.getPolicy({ FunctionName: lambda }).promise()
      if (Policy === undefined) {
        throw Object.assign(new Error('?'), { code: 'NoSuchKey' })
      }
      return JSON.parse(Policy)
    } catch (err) {
      Errors.ignoreNotFound(err)
      throw new Errors.NotFound(`policy for lambda: ${lambda}`)
    }
  }

  public addPermission = async (params: AWS.Lambda.AddPermissionRequest) => {
    return await this.client.addPermission(params).promise()
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
      return policy.Statement.some((s: any) => s.Principal.Service === service)
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

  public updateEnvironment = async (opts: Types.UpdateEnvOpts) => {
    const { update, functionName } = opts
    let { current } = opts
    if (!current) {
      current = await this.getConfiguration(functionName)
    }

    const updated: Partial<typeof update> = {}
    const { Variables } = current.Environment
    for (const key in update) {
      // allow null == undefined
      // tslint:disable-next-line:triple-equals
      if (Variables[key] != update[key]) {
        updated[key] = update[key]
      }
    }

    if (!Object.keys(updated).length) {
      return false
    }

    for (const key in updated) {
      const val = updated[key]
      if (val == null) {
        delete Variables[key]
      } else {
        Variables[key] = val
      }
    }

    await this.client
      .updateFunctionConfiguration({
        FunctionName: functionName,
        Environment: { Variables }
      })
      .promise()

    return true
  }

  public listFunctions = async () => {
    let all: AWS.Lambda.Types.FunctionConfiguration[] = []
    const opts: AWS.Lambda.Types.ListFunctionsRequest = {}
    while (true) {
      const { NextMarker, Functions } = await this.client.listFunctions(opts).promise()
      if (Functions !== undefined) {
        all = all.concat(Functions)
      }
      if (!NextMarker) break

      opts.Marker = NextMarker
    }

    return all
  }
}

export const createClient = (opts: Types.ClientOpts) => new LambdaClient(opts)
