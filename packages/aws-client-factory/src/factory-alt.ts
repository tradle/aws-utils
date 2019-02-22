import { EventEmitter } from 'events'
import AWS from 'aws-sdk'
import { useGlobalConfigClock, CreateClientsFactoryOpts } from './factory'

export class ClientFactory1 extends EventEmitter {
  private _configClient = <T extends AWS.Service>(client: T): T => {
    if (this._opts.useGlobalConfigClock) {
      useGlobalConfigClock(client)
    }

    this.emit('new', client)
    return client
  }

  constructor(private _opts: CreateClientsFactoryOpts) {
    super()
  }
  public s3 = (opts: AWS.S3.Types.ClientConfiguration = {}) => this._configClient(new AWS.S3(opts))
  public dynamodb = (opts: AWS.DynamoDB.Types.ClientConfiguration = {}) => this._configClient(new AWS.DynamoDB(opts))
  public documentclient = (
    opts: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {}
    // @ts-ignore
  ) => this._configClient(new AWS.DynamoDB.DocumentClient(opts))
  public dynamodbstreams = (opts: AWS.DynamoDBStreams.Types.ClientConfiguration = {}) =>
    this._configClient(new AWS.DynamoDBStreams(opts))
  public iam = (opts: AWS.IAM.Types.ClientConfiguration = {}) => this._configClient(new AWS.IAM(opts))
  public iot = (opts: AWS.Iot.Types.ClientConfiguration = {}) => this._configClient(new AWS.Iot(opts))
  public sts = (opts: AWS.STS.Types.ClientConfiguration = {}) => this._configClient(new AWS.STS(opts))
  public sns = (opts: AWS.SNS.Types.ClientConfiguration = {}) => this._configClient(new AWS.SNS(opts))
  public sqs = (opts: AWS.SQS.Types.ClientConfiguration = {}) => this._configClient(new AWS.SQS(opts))
  public ses = (opts: AWS.SES.Types.ClientConfiguration = {}) => this._configClient(new AWS.SES(opts))
  public kms = (opts: AWS.KMS.Types.ClientConfiguration = {}) => this._configClient(new AWS.KMS(opts))
  public lambda = (opts: AWS.Lambda.Types.ClientConfiguration = {}) => this._configClient(new AWS.Lambda(opts))
  public iotdata = (opts: AWS.IotData.Types.ClientConfiguration = {}) => this._configClient(new AWS.IotData(opts))
  public xray = (opts: AWS.XRay.Types.ClientConfiguration = {}) => this._configClient(new AWS.XRay(opts))
  public apigateway = (opts: AWS.APIGateway.Types.ClientConfiguration = {}) =>
    this._configClient(new AWS.APIGateway(opts))
  public cloudwatch = (opts: AWS.CloudWatch.Types.ClientConfiguration = {}) =>
    this._configClient(new AWS.CloudWatch(opts))
  public cloudwatchlogs = (opts: AWS.CloudWatchLogs.Types.ClientConfiguration = {}) =>
    this._configClient(new AWS.CloudWatchLogs(opts))
  public cloudformation = (opts: AWS.CloudFormation.Types.ClientConfiguration = {}) =>
    this._configClient(new AWS.CloudFormation(opts))
}
