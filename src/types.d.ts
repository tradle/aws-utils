import { ClientFactory } from './client-factory'

// export interface Logger {
// 	debug: (...args: any[]) => void
// 	info: (...args: any[]) => void
// 	warn: (...args: any[]) => void
// 	error: (...args: any[]) => void
// 	fatal: (...args: any[]) => void
// 	trace?: (...args: any[]) => void

// 	// make @tradle/dynamodb happy
// 	silly: (...args: any[]) => void
// 	log: (...args: any[]) => void
// }

export { ClientFactory }

export interface CreateClientFactoryDefaults extends AWS.ConfigService.ClientConfiguration {
  region: string
}

export interface CreateClientsFactoryOpts {
  defaults: CreateClientFactoryDefaults
  useGlobalConfigClock: boolean
}

export interface AWSClientOpts {
  getClient: ClientFactory
}

export interface Country {
  cca3: string
  title: string
  awsRegion?: string
  callingCodes?: string[]
}

// SNS
declare namespace SNS {
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
}

export { SNS }

// Lambda

declare namespace Lambda {
  interface ClientOpts extends AWSClientOpts {}
}

export { Lambda }
