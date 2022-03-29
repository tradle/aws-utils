import { ClientFactory } from '@tradle/aws-client-factory'

export class E164 {
  callingCode: string
  number: string

  constructor (callingCode: string, number: string) {
    this.callingCode = callingCode
    this.number = number
  }

  toString () {
    return `+${this.callingCode}${this.number}`
  }

  toJSON () {
    return {
      callingCode: this.callingCode,
      number: this.number
    }
  }
}

export interface SendSMSOpts {
  phoneNumber: string | E164
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
