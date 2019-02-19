import AWS from 'aws-sdk'
import merge from 'lodash/merge'
import pick from 'lodash/pick'
import { AWSConfig } from './types'

export const mergeIntoAWSConfig = (opts: AWSConfig) => {
  const merged = merge(opts, pick(AWS.config, Object.keys(opts)))
  AWS.config.update(merged)
}
