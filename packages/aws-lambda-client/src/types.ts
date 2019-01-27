import { ClientFactory } from '@tradle/aws-client-factory'
export interface ClientOpts {
  clients: ClientFactory
}

export interface CanInvokeOpts {
  lambda: string
  service: string
}

export interface InvokeOpts {
  name: string
  arg?: any
  sync?: boolean
  log?: boolean
  qualifier?: string
}
