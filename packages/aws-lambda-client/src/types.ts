import AWS from 'aws-sdk'
export interface ClientOpts {
  client: AWS.Lambda
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

export interface UpdateEnvOpts {
  functionName: string
  current?: any
  update: any
}
