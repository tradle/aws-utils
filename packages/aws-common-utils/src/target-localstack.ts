import { getLocalStack } from './localstack'
import { mergeIntoAWSConfig } from './config'
import { AWSConfig, AWSSDK } from './types'

export const getLocalstackConfig = () => {
  const config: AWSConfig = { region: process.env.AWS_REGION || 'us-east-1' }
  const localstack = getLocalStack()
  for (const service in localstack) {
    const lowercase = service.toLowerCase()
    config[lowercase] = {
      endpoint: localstack[service],
      region: config.region
    }
  }

  config.s3ForcePathStyle = config.s3.s3ForcePathStyle = true
  return config
}

export const targetLocalstack = (AWS: AWSSDK) => mergeIntoAWSConfig(AWS, getLocalstackConfig())
