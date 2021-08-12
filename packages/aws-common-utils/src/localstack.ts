import { getLocalIp } from './local-ip'

export function getLocalStack () {
  const ip = getLocalIp()
  return {
    APIGateway: `http://${ip}:4567`,
    Kinesis: `http://${ip}:4568`,
    DynamoDB: `http://${ip}:4569`,
    DynamoDBStreams: `http://${ip}:4570`,
    S3: `http://${ip}:4572`,
    Firehose: `http://${ip}:4573`,
    Lambda: `http://${ip}:4574`,
    SNS: `http://${ip}:4575`,
    SQS: `http://${ip}:4576`,
    Redshift: `http://${ip}:4577`,
    ES: `http://${ip}:4578`,
    SES: `http://${ip}:4579`,
    Route53: `http://${ip}:4580`,
    CloudFormation: `http://${ip}:4581`,
    CloudWatch: `http://${ip}:4582`,
    CloudWatchLogs: `http://${ip}:4582`,
    SSM: `http://${ip}:4583`,
    IotData: `http://${ip}:1884`,
    Iot: `http://${ip}:1884`
  }
}
