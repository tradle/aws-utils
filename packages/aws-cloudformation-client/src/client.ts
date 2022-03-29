import { CloudFormation } from 'aws-sdk'

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

  public async listStacks () {
    let stacks: AWS.CloudFormation.StackSummaries = []
    while (true) {
      const { StackSummaries, NextToken } = await this.client.listStacks().promise()
      if (StackSummaries !== undefined) {
        stacks = stacks.concat(StackSummaries)
      }
      if (!NextToken) break
    }

    return stacks
  }

  public async getStackResources (StackName: string) {
    let resources: AWS.CloudFormation.StackResourceSummaries = []
    const opts: AWS.CloudFormation.ListStackResourcesInput = { StackName }
    while (true) {
      const { StackResourceSummaries, NextToken } = await this.client.listStackResources(opts).promise()
      if (StackResourceSummaries !== undefined) {
        resources = resources.concat(StackResourceSummaries)
      }
      opts.NextToken = NextToken
      if (!opts.NextToken) break
    }

    return resources
  }

  public async listStackFunctions (StackName: string) {
    const resources = await this.getStackResources(StackName)
    const lambdaNames: string[] = []
    for (const { ResourceType, PhysicalResourceId } of resources) {
      if (ResourceType === 'AWS::Lambda::Function' && PhysicalResourceId) {
        lambdaNames.push(PhysicalResourceId)
      }
    }

    return lambdaNames
  }

  public async getStackTemplate (stackArn: string) {
    const { TemplateBody } = await this.client.getTemplate({ StackName: stackArn }).promise()
    return TemplateBody ? JSON.parse(TemplateBody) : {}
  }

  public async getStackParameterValues (stackArn: string) {
    const { Parameters } = await this.describeStack(stackArn)
    return (Parameters ?? []).reduce((map, { ParameterKey, ParameterValue }) => {
      if (ParameterKey !== undefined) {
        map[ParameterKey] = ParameterValue
      }
      return map
    }, {} as { [key: string]: string | undefined })
  }

  public async describeStack (stackArn: string) {
    const { Stacks } = await this.client.describeStacks({ StackName: stackArn }).promise()
    const stack = Stacks?.[0]
    if (stack === undefined) {
      throw Object.assign(new Error('Stack not found'), { code: 'ResourceNotFoundException' })
    }
    return stack
  }

  public async updateStack ({ stackName, templateUrl, notificationTopics = [] }: UpdateStackOpts) {
    const params: AWS.CloudFormation.UpdateStackInput = {
      StackName: stackName,
      TemplateURL: templateUrl,
      Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
      Parameters: []
    }

    if (notificationTopics.length) {
      params.NotificationARNs = notificationTopics
    }
    return this.client.updateStack(params).promise()
  }

  public async enableTerminationProtection (stackName: string) {
    await this.changeTerminationProtection({ stackName, enable: true })
  }

  public async disableTerminationProtection (stackName: string) {
    await this.changeTerminationProtection({ stackName, enable: false })
  }

  private async changeTerminationProtection ({ stackName, enable }: ChangeTerminationProtectionOpts) {
    await this.client
      .updateTerminationProtection({
        StackName: stackName,
        EnableTerminationProtection: enable
      })
      .promise()
  }
}

export const createClient = (opts: CloudFormationClientOpts) => new CloudFormationClient(opts)
