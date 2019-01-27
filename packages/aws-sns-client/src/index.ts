import AWS from 'aws-sdk'
import acceptAll from 'lodash/stubTrue'
import isMatch from 'lodash/isMatch'
import getPropAtPath from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { parseE164, getAWSRegionByCallingCode } from './geo'
import { ClientFactory } from '@tradle/aws-client-factory'
import { pickNonNull, getRegionFromArn, randomStatementId } from '@tradle/aws-common-utils'
import * as SNS from './types'

const MESSAGE_ATTRIBUTES = {
  smsType: 'AWS.SNS.SMS.SMSType',
  senderId: 'AWS.SNS.SMS.SenderID'
}

const SMS_PRIORITY = {
  high: 'Transactional',
  low: 'Promotional'
}

interface Policy {
  Statement: []
}

interface PolicyStatement {
  Sid?: string
  Effect: 'Allow' | 'Deny'
  Principal: {
    AWS?: string | string[]
  }
  Action: string | string[]
  Resource: string | string[]
}

export const parseTargetProtocol = (target: string): SNS.DeliveryProtocol => {
  if (target.startsWith('arn:aws')) {
    return target.split(':')[2] as SNS.DeliveryProtocol
  }

  if (target.startsWith('http://')) return 'http'
  if (target.startsWith('https://')) return 'https'

  if (/^\d+$/.test(target)) return 'sms'

  return 'application'
}

export class SNSClient {
  private clients: ClientFactory
  constructor({ clients }: SNS.ClientOpts) {
    this.clients = clients
  }

  public createTopic = async ({ name, region }: SNS.CreateTopicOpts) => {
    const { TopicArn } = await this._client(region)
      .createTopic({ Name: name })
      .promise()
    return TopicArn
  }

  public deleteTopic = async (topic: string) => {
    // this.logger.debug('deleting topic', { topic })
    await this._client(topic)
      .deleteTopic({ TopicArn: topic })
      .promise()
  }

  public deleteAllSubscriptions = async (topic: string) => {
    // this.logger.debug('deleting all subscriptions', { topic })
    const subs = await this.listSubscriptions({ topic })
    await Promise.all(subs.map(sub => this.unsubscribe(sub.SubscriptionArn)))
  }

  public getTopicAttributes = async (topic: string) => {
    return await this._client(getRegionFromArn(topic))
      .getTopicAttributes({ TopicArn: topic })
      .promise()
  }

  public setTopicAttributes = async (params: AWS.SNS.SetTopicAttributesInput) => {
    await this._client(params.TopicArn)
      .setTopicAttributes(params)
      .promise()
  }

  public subscribe = async ({ topic, target, protocol }: SNS.SubscribeOpts) => {
    if (!protocol) protocol = parseTargetProtocol(target)

    const { SubscriptionArn } = await this._client(topic)
      .subscribe({
        TopicArn: topic,
        Endpoint: target,
        Protocol: protocol
      })
      .promise()

    return SubscriptionArn
  }

  public unsubscribe = async (SubscriptionArn: string) => {
    await this._client(SubscriptionArn)
      .unsubscribe({ SubscriptionArn })
      .promise()
  }

  public listSubscriptions = async ({
    topic,
    filter = acceptAll
  }: {
    topic: string
    filter?: (sub: AWS.SNS.Subscription) => boolean
  }) => {
    const params: AWS.SNS.ListSubscriptionsByTopicInput = {
      TopicArn: topic
    }

    const sns = this._client(topic)
    let batch: AWS.SNS.ListSubscriptionsByTopicResponse
    let matches: AWS.SNS.Subscription[] = []
    do {
      batch = await sns.listSubscriptionsByTopic(params).promise()
      matches = matches.concat(batch.Subscriptions.filter(filter))
    } while (batch.NextToken)

    return matches
  }

  public subscribeIfNotSubscribed = async ({ topic, protocol, target }: SNS.SubscribeOpts) => {
    const existing = await this.listSubscriptions({
      topic,
      filter: subscription => isMatch(subscription, { Protocol: protocol, Endpoint: target })
    })

    let sub: string
    if (existing.length) {
      sub = existing[0].SubscriptionArn
    } else {
      // this.logger.debug(`subscribing ${protocol} to topic`, { target, topic })
      sub = await this.subscribe({ topic, target, protocol })
    }

    return sub
  }

  public publish = async ({ topic, subject, message }: SNS.PublishOpts) => {
    const params: AWS.SNS.PublishInput = {
      TopicArn: topic,
      Subject: subject,
      Message: null
    }

    if (typeof message === 'string') {
      params.Message = message
    } else {
      params.MessageStructure = 'json'
      params.Message = JSON.stringify({
        ...message,
        default: typeof message.default === 'string' ? message.default : JSON.stringify(message.default)
      })
    }

    await this._client(topic)
      .publish(pickNonNull(params))
      .promise()
  }

  public sendSMS = async ({ phoneNumber, message, senderId, highPriority }: SNS.SendSMSOpts) => {
    const { callingCode, number } = parseE164(phoneNumber)
    const region = getAWSRegionByCallingCode(callingCode)
    const client = this._client(region)
    // this.logger.silly('sending SMS', { region, callingCode, number })
    const params: AWS.SNS.PublishInput = {
      PhoneNumber: callingCode + number,
      Message: message,
      MessageAttributes: {}
    }

    if (senderId) {
      params.MessageAttributes[MESSAGE_ATTRIBUTES.senderId] = { DataType: 'String', StringValue: 'Tradle' }
    }

    params.MessageAttributes[MESSAGE_ATTRIBUTES.smsType] = {
      DataType: 'String',
      StringValue: highPriority ? SMS_PRIORITY.high : SMS_PRIORITY.low
    }

    await client.publish(params).promise()
  }

  public allowCrossAccountPublish = async (topic: string, accounts: string[]) => {
    const { Attributes } = await this.getTopicAttributes(topic)
    const policy = JSON.parse(Attributes.Policy) as Policy
    // remove old statements
    const statements: PolicyStatement[] = policy.Statement.filter(statement => {
      const current = getPropAtPath(statement, 'Principal.AWS')
      // coerce to array
      const allowed = [].concat(current || [])
      return !isEqual(allowed, accounts)
    })

    statements.push(genCrossAccountPublishPermission(topic, accounts))
    const params: AWS.SNS.SetTopicAttributesInput = {
      TopicArn: topic,
      AttributeName: 'Policy',
      AttributeValue: JSON.stringify({
        ...policy,
        Statement: statements
      })
    }

    await this.setTopicAttributes(params)
  }

  private _client = (arnOrRegion: string) => {
    const region = arnOrRegion.startsWith('arn:aws') ? getRegionFromArn(arnOrRegion) : arnOrRegion
    return this.clients.sns({ region })
  }
}

export const genSetDeliveryPolicyParams = (TopicArn: string, policy: any): AWS.SNS.SetTopicAttributesInput => ({
  TopicArn,
  AttributeName: 'DeliveryPolicy',
  AttributeValue: JSON.stringify(policy)
})

export const genCrossAccountPublishPermission = (topic: string, accounts: string[]): PolicyStatement => ({
  Sid: randomStatementId('allowCrossAccountPublish'),
  Effect: 'Allow',
  Principal: {
    AWS: accounts
  },
  Action: 'SNS:Publish',
  Resource: topic
})

export const createClient = (opts: SNS.ClientOpts) => new SNSClient(opts)
export const regions = [
  'us-east-2',
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'ap-south-1',
  'ap-northeast-3',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'cn-north-1',
  'cn-northwest-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
  'sa-east-1',
  'us-gov-east-1',
  'us-gov-west-1'
]
