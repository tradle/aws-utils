import { createClient as sns } from '@tradle/aws-sns-client'
import { createClient as lambda } from '@tradle/aws-lambda-client'
import { createClient as s3 } from '@tradle/aws-s3-client'
import { createClient as iam } from '@tradle/aws-iam-client'
import * as utils from '@tradle/aws-common-utils'

export { createClientFactory } from '@tradle/aws-client-factory'
export { utils }

export const services = {
  sns,
  lambda,
  s3,
  iam
}

export type AWSServices = typeof services
