import { Lambda, CloudFormation } from 'aws-sdk'
import { ClientFactory } from '@tradle/aws-client-factory'
import { CFTemplate } from './types'
import * as utils from './utils'

export interface StackInfo {
  arn: string
  name: string
  region: string
}

export interface CloudFormationClientOpts {
  clients: ClientFactory
}

export interface ChangeTerminationProtectionOpts {
  stackName: string
  enable: boolean
}

export interface UpdateStackOpts {
  stackName: string
  templateUrl: string
  notificationTopics?: string[]
}
export class CloudFormationClient {
  private client: CloudFormation

  constructor({ clients }: CloudFormationClientOpts) {
    this.client = clients.cloudformation()
  }

  public listStacks = async (): Promise<AWS.CloudFormation.StackSummaries> => {
    let stacks = []
    const opts: AWS.CloudFormation.ListStacksInput = {}
    while (true) {
      const { StackSummaries, NextToken } = await this.client.listStacks().promise()
      stacks = stacks.concat(StackSummaries)
      if (!NextToken) break
    }

    return stacks
  }

  public getStackResources = async (StackName: string): Promise<AWS.CloudFormation.StackResourceSummaries> => {
    let resources = []
    const opts: AWS.CloudFormation.ListStackResourcesInput = { StackName }
    while (true) {
      const { StackResourceSummaries, NextToken } = await this.client.listStackResources(opts).promise()

      resources = resources.concat(StackResourceSummaries)
      opts.NextToken = NextToken
      if (!opts.NextToken) break
    }

    return resources
  }

  public listStackFunctions = async (StackName: string): Promise<string[]> => {
    const resources = await this.getStackResources(StackName)
    const lambdaNames: string[] = []
    for (const { ResourceType, PhysicalResourceId } of resources) {
      if (ResourceType === 'AWS::Lambda::Function' && PhysicalResourceId) {
        lambdaNames.push(PhysicalResourceId)
      }
    }

    return lambdaNames
  }

  // public getStackFunctionConfigurations = async (StackName?:string)
  //   :Promise<Lambda.Types.FunctionConfiguration[]> => {
  //   const names = await this.listStackFunctions()
  //   return Promise.all(names.map(name => this.getConfiguration(name)))
  // }

  public getStackTemplate = async (stackArn: string) => {
    const { TemplateBody } = await this.client.getTemplate({ StackName: stackArn }).promise()
    return JSON.parse(TemplateBody)
  }

  public getStackParameterValues = async (stackArn: string): Promise<any> => {
    const { Parameters } = await this.describeStack(stackArn)
    return Parameters.reduce((map, param) => {
      // map[param.ParameterKey] = param.ParameterValue || template.Parameters[param.ParameterKey].Default
      map[param.ParameterKey] = param.ParameterValue
      return map
    }, {})
  }

  public describeStack = async (stackArn: string) => {
    const { Stacks } = await this.client.describeStacks({ StackName: stackArn }).promise()
    return Stacks[0]
  }

  public getLambdaS3Keys = (template: CFTemplate) => {
    const { Resources } = template
    return this.getResourceNamesByType(template, 'AWS::Lambda::Function').map(name => ({
      path: `Resources['${name}'].Properties.Code.S3Key`,
      value: Resources[name].Properties.Code.S3Key
    }))
  }

  public updateStack = async ({ stackName, templateUrl, notificationTopics = [] }: UpdateStackOpts) => {
    const params: AWS.CloudFormation.UpdateStackInput = {
      StackName: stackName,
      TemplateURL: templateUrl,
      Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
      Parameters: []
    }

    if (notificationTopics.length) {
      params.NotificationARNs = notificationTopics
    }

    // this.logger.info('updating this stack')
    return this.client.updateStack(params).promise()
  }

  public enableTerminationProtection = async stackName => {
    await this.changeTerminationProtection({ stackName, enable: true })
  }

  public disableTerminationProtection = async stackName => {
    await this.changeTerminationProtection({ stackName, enable: false })
  }

  private changeTerminationProtection = async ({ stackName, enable }: ChangeTerminationProtectionOpts) => {
    await this.client
      .updateTerminationProtection({
        StackName: stackName,
        EnableTerminationProtection: enable
      })
      .promise()

    // this.logger.debug('changed stack termination protection', {
    //   protected: enable,
    //   stack: stackName
    // })
  }

  public getResourcesByType = (template: CFTemplate, type: string) => {
    return this.getResourceNamesByType(template, type).map(name => template.Resources[name])
  }

  public getResourceNamesByType = (template: CFTemplate, type: string) => {
    const { Resources } = template
    return Object.keys(Resources).filter(name => Resources[name].Type === type)
  }
}

export const createClient = (opts: CloudFormationClientOpts) => new CloudFormationClient(opts)
export { utils }
