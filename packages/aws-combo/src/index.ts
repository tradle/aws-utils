import { createClient as sns } from '@tradle/aws-sns-client'
import { createClient as lambda } from '@tradle/aws-lambda-client'
import { createClient as s3 } from '@tradle/aws-s3-client'
import { createClient as iam } from '@tradle/aws-iam-client'
import { createClient as cloudwatch } from '@tradle/aws-cloudwatch-client'
import { createClient as cloudformation } from '@tradle/aws-cloudformation-client'
import { Errors, info } from '@tradle/aws-common-utils'
import * as utils from '@tradle/aws-common-utils'

export { createClientFactory, monitor as monitorClient } from '@tradle/aws-client-factory'
export { Errors, info, utils }

export const services = {
  sns,
  lambda,
  s3,
  iam,
  cloudwatch,
  cloudformation
}

export * from './get-stack-fn-configurations'
export * from './update-environments'
export * from './reinitialize-containers'
export type AWSServices = typeof services
