import AWS from 'aws-sdk'
import Errors from '@tradle/errors'
import { ClientFactory } from '@tradle/aws-client-factory'
import { alphabetical, sha256Hex } from '@tradle/aws-common-utils'

const CRR_NAME = 'cross-region-replication-role'
const CRR_POLICY = 'cross-region-replication-policy'

export interface CreateS3ReplicationRoleOpts {
  source: string
  targets: string[]
}

export interface IAMClientOpts {
  client: AWS.IAM
}

export class IAMClient {
  private iam: AWS.IAM
  constructor({ client }: IAMClientOpts) {
    this.iam = client
  }
  public createRole = async (opts: AWS.IAM.CreateRoleRequest) => {
    const { Role } = await this.iam.createRole(opts).promise()
    return Role
  }

  public createRoleIfNotExists = async (opts: AWS.IAM.CreateRoleRequest) => {
    try {
      return await this.createRole(opts)
    } catch (err) {
      Errors.ignore(err, { code: 'EntityAlreadyExists' })
      const { Role } = await this.iam.getRole({ RoleName: opts.RoleName }).promise()
      return Role
    }
  }
  public createS3ReplicationRole = async ({ source, targets }: CreateS3ReplicationRoleOpts) => {
    const permissionsPolicy = createS3ReplicationPermissionPolicy({ source, targets })
    const csv = targets
      .concat(source)
      .sort(alphabetical)
      .join(',')

    const hash = sha256Hex(csv).slice(0, 10)
    const description = `for replicating ${source} to: ${targets.join(', ')}`
    const roleName = `${CRR_NAME}-${hash}`
    const role = await this.createRole({
      RoleName: roleName,
      Description: description,
      AssumeRolePolicyDocument: s3ServiceTrustPolicyStr
    })

    const policy = await this.createPolicy({
      PolicyName: `${CRR_POLICY}-${hash}`,
      Description: description,
      PolicyDocument: JSON.stringify(permissionsPolicy)
    })

    await this.iam
      .attachRolePolicy({
        RoleName: roleName,
        PolicyArn: policy.Arn
      })
      .promise()

    return {
      role: role.Arn,
      policy: policy.Arn
    }
  }
  public createPolicy = async (opts: AWS.IAM.CreatePolicyRequest) => {
    const { Policy } = await this.iam.createPolicy(opts).promise()
    return Policy
  }

  public getPolicy = async (arn: string) => {
    const { Policy } = await this.iam.getPolicy({ PolicyArn: arn }).promise()
    return Policy
  }
}

const s3ServiceTrustPolicyStr = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: {
        Service: 's3.amazonaws.com'
      },
      Action: 'sts:AssumeRole'
    }
  ]
})

const createS3ReplicationPermissionPolicy = ({ source, targets }: CreateS3ReplicationRoleOpts) => ({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: ['s3:GetObjectVersionForReplication', 's3:GetObjectVersionAcl'],
      Resource: [`arn:aws:s3:::${source}/*`]
    },
    {
      Effect: 'Allow',
      Action: ['s3:ListBucket', 's3:GetReplicationConfiguration'],
      Resource: [`arn:aws:s3:::${source}`]
    }
  ].concat(
    targets.map(target => ({
      Effect: 'Allow',
      Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
      Resource: [`arn:aws:s3:::${target}/*`]
    }))
  )
})

export const createClient = (opts: IAMClientOpts) => new IAMClient(opts)
