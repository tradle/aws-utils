import AWS from 'aws-sdk'
import getLocalIP from 'localip'
import { localstack } from './localstack'

export const targetLocalstack = () => {
  const localIP = getLocalIP()

  for (const service in localstack) {
    const lowercase = service.toLowerCase()
    AWS.config.update({
      [lowercase]: {
        endpoint: localstack[service].replace(/localhost/, localIP)
      }
    })
  }

  AWS.config.update({
    s3: {
      s3ForcePathStyle: true,
      endpoint: localstack.S3
    }
  })
}
