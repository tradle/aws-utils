import AWS from 'aws-sdk'
import getLocalIP from 'localip'
import { localstack } from './localstack'
import { mergeIntoAWSConfig } from './config'

const localIP = getLocalIP()
const getLocalstackEndpointWithLocalIP = (service: string) => localstack[service].replace(/localhost/, localIP)

type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any ? U : any

export const targetLocalstack = () => {
  const config: FirstArgument<AWS.Config['update']> = {}
  for (const service in localstack) {
    const lowercase = service.toLowerCase()
    config[lowercase] = {
      endpoint: getLocalstackEndpointWithLocalIP(service)
    }
  }

  config.s3ForcePathStyle = config.s3.s3ForcePathStyle = true
  mergeIntoAWSConfig(config)
}
