import getLocalIP from 'localip'
import { localstack } from './localstack'
import { mergeIntoAWSConfig } from './config'
import { AWSConfig, AWSSDK } from './types'

const localIP = getLocalIP()
const getLocalstackEndpointWithLocalIP = (service: string) => localstack[service].replace(/localhost/, localIP)

export const getLocalstackConfig = () => {
  const config: AWSConfig = { region: process.env.AWS_REGION || 'us-east-1' }
  for (const service in localstack) {
    const lowercase = service.toLowerCase()
    config[lowercase] = {
      endpoint: getLocalstackEndpointWithLocalIP(service),
      region: config.region
    }
  }

  config.s3ForcePathStyle = config.s3.s3ForcePathStyle = true
  return config
}

export const targetLocalstack = (AWS: AWSSDK) => mergeIntoAWSConfig(AWS, getLocalstackConfig())
