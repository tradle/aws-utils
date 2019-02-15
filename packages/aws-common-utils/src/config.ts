import AWS from 'aws-sdk'
import merge from 'lodash/merge'
import pick from 'lodash/pick'
import { FirstArgument } from './types'

export const mergeIntoAWSConfig = (opts: FirstArgument<AWS.Config['update']>) => {
  const merged = merge(opts, pick(AWS.config, Object.keys(opts)))
  AWS.config.update(merged)
}
