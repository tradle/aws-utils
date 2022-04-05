import AWS from 'aws-sdk'
import acceptAll from 'lodash/stubTrue'
import isMatch from 'lodash/isMatch'
import getPropAtPath from 'lodash/get'
import isEqual from 'lodash/isEqual'
import { parseE164 } from './geo'
import { ClientFactory } from '@tradle/aws-client-factory'
import { pickNonNull, getRegionFromArn, randomStatementId, parseArn, currentRegion } from '@tradle/aws-common-utils'
import * as SNS from './types'
import { MessageAttributeMap } from 'aws-sdk/clients/sns'

export { parseE164 } from './geo'

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
    await Promise.all(subs.map(async ({ SubscriptionArn }) => {
      if (SubscriptionArn !== undefined) {
        await this.unsubscribe(SubscriptionArn)
      }
    }))
  }

  public getTopicAttributes = async (topic: string): Promise<AWS.SNS.GetTopicAttributesResponse> => {
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
      const { Subscriptions } = batch
      if (Subscriptions !== undefined) {
        matches = matches.concat(Subscriptions.filter(filter))
      }
    } while (batch.NextToken)

    return matches
  }

  public subscribeIfNotSubscribed = async ({ topic, protocol, target }: SNS.SubscribeOpts) => {
    const existing = await this.listSubscriptions({
      topic,
      filter: subscription => isMatch(subscription, { Protocol: protocol, Endpoint: target })
    })

    let sub: string | undefined
    if (existing.length) {
      sub = existing[0].SubscriptionArn
    }

    if (sub === undefined) {
      // this.logger.debug(`subscribing ${protocol} to topic`, { target, topic })
      sub = await this.subscribe({ topic, target, protocol })
      if (sub === undefined) {
        throw new Error('Subscription didnt work')
      }
    }

    return sub
  }

  public publish = async ({ topic, subject, message }: SNS.PublishOpts) => {
    let messageStructure: 'json' | undefined
    if (typeof message !== 'string') {
      messageStructure = 'json'
      message = JSON.stringify({
        ...message,
        default: typeof message.default === 'string' ? message.default : JSON.stringify(message.default)
      })
    }

    const params: AWS.SNS.PublishInput = {
      TopicArn: topic,
      Subject: subject,
      Message: message,
      MessageStructure: messageStructure
    }

    await this._client(topic)
      .publish(pickNonNull(params))
      .promise()
  }

  public sendSMS = async ({ phoneNumber, message, senderId, highPriority }: SNS.SendSMSOpts) => {
    const { callingCode, number } = parseE164(phoneNumber)
    const region = currentRegion.info
    if (region.fallback?.sns === null) {
      // === null indicates that there is no fallback for sms. (different from === undefined!)
      throw new Error(`Sending of sms is not supported in the entire region partition: ${region.partition}`)
    }
    const client = this._client(region.fallback?.sns ?? region.code)

    // this.logger.silly('sending SMS', { region, callingCode, number })
    const attributes: MessageAttributeMap = {}
    if (senderId) {
      attributes[MESSAGE_ATTRIBUTES.senderId] = { DataType: 'String', StringValue: 'Tradle' }
    }

    attributes[MESSAGE_ATTRIBUTES.smsType] = {
      DataType: 'String',
      StringValue: highPriority ? SMS_PRIORITY.high : SMS_PRIORITY.low
    }

    await client.publish({
      PhoneNumber: callingCode + number,
      Message: message,
      MessageAttributes: attributes
    }).promise()
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

  public parseE164 = parseE164
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

export const parseTopicArn = (arn: string) => {
  const parts = parseArn(arn)
  return {
    ...parts,
    name: parts.relativeId
  }
}
