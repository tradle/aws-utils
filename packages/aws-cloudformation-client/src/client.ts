import { CloudFormation } from 'aws-sdk'
import { CFTemplate } from './types'
import * as utils from './utils'

export interface StackInfo {
  arn: string
  name: string
  region: string
}

export interface CloudFormationClientOpts {
  client: CloudFormation
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

  constructor({ client }: CloudFormationClientOpts) {
    this.client = client
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
}

export const createClient = (opts: CloudFormationClientOpts) => new CloudFormationClient(opts)
