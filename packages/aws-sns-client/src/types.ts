import { ClientFactory } from '@tradle/aws-client-factory'

export interface SendSMSOpts {
  phoneNumber: string
  message: string
  senderId?: string
  highPriority?: boolean
}

export interface Message {
  default: any
  email?: any
  lambda?: any
  http?: any
  https?: any
}

export interface ClientOpts {
  clients: ClientFactory
}

export type DeliveryProtocol = 'http' | 'https' | 'email' | 'email-json' | 'lambda' | 'sms' | 'sqs' | 'application'

export interface PublishOpts {
  topic: string
  message: Message | string
  subject?: string
}

export interface CreateTopicOpts {
  name: string
  region: string
}

export interface SubscribeOpts {
  topic: string
  target: string
  protocol?: DeliveryProtocol
}
