import merge from 'lodash/merge'
import pick from 'lodash/pick'
import { AWSConfig, AWSSDK } from './types'

export const mergeIntoAWSConfig = (AWS: AWSSDK, opts: AWSConfig) => {
  const merged = merge(opts, pick(AWS.config, Object.keys(opts)))
  AWS.config.update(merged)
}
