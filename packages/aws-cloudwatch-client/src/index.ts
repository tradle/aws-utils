import omit from 'lodash/omit'
import cloneDeep from 'lodash/cloneDeep'
import flatten from 'lodash/flatten'
import AWS from 'aws-sdk'
import { metrics as METRICS } from './metrics'

export type AlarmTransform = (alarm: AWS.CloudWatch.PutMetricAlarmInput) => AWS.CloudWatch.PutMetricAlarmInput
export interface CloudWatchClientOpts {
  client: AWS.CloudWatch
}

export interface BaseDynamoDBOpOpts {
  tables: string[]
}

export interface UpdateDynamoDBConsumptionAlarmsOpts extends BaseDynamoDBOpOpts {
  transform: AlarmTransform
}

export interface ListDynamoDBConsumptionAlarmsOpts extends BaseDynamoDBOpOpts {}

// adapted from
// https://github.com/theburningmonk/better-dynamodb-scaling

export class CloudWatchClient {
  private client: AWS.CloudWatch
  constructor({ client }: CloudWatchClientOpts) {
    this.client = client
  }

  public updateDynamodbConsumptionAlarms = async ({ tables, transform }: UpdateDynamoDBConsumptionAlarmsOpts) => {
    const alarms = await this.listDynamoDBConsumptionAlarms({ tables })
    if (!alarms.length) return

    await Promise.all(
      alarms.map(alarm => {
        const current = cloneDeep(toPutFormat(alarm))
        return this.putMetricAlarm(transform(current))
      })
    )
  }

  public listDynamoDBConsumptionAlarms = async ({ tables }: ListDynamoDBConsumptionAlarmsOpts) => {
    const metrics = flatten(tables.map(getConsumptionMetricsParams))
    return await this.listAlarmsForMetrics(metrics)
  }

  public listAlarmsForMetrics = async (params: AWS.CloudWatch.DescribeAlarmsForMetricInput[]) => {
    const metrics = await Promise.all(params.map(metric => this.listAlarmsForMetric(metric)))
    return flatten(metrics)
  }

  public listAlarmsForMetric = async (params: AWS.CloudWatch.DescribeAlarmsForMetricInput) => {
    const { MetricAlarms = [] } = await this.client.describeAlarmsForMetric(params).promise()
    return MetricAlarms
  }

  public listAlarms = async (params: AWS.CloudWatch.DescribeAlarmsInput) => {
    return await this.client.describeAlarms(params).promise()
  }

  public putMetricAlarm = async (params: AWS.CloudWatch.PutMetricAlarmInput) => {
    await this.client.putMetricAlarm(params).promise()
  }
}

const PROPS_NOT_IN_PUT_FORMAT = [
  'AlarmArn',
  'AlarmConfigurationUpdatedTimestamp',
  'StateValue',
  'StateReason',
  'StateReasonData',
  'StateUpdatedTimestamp'
]

export const toPutFormat = (alarm: AWS.CloudWatch.MetricAlarm) =>
  omit(alarm, PROPS_NOT_IN_PUT_FORMAT) as AWS.CloudWatch.PutMetricAlarmInput

export const getConsumptionMetricsParams = (tableName: string) =>
  METRICS.dynamodb.consumption.map(params => ({
    ...params,
    Dimensions: [{ Name: 'TableName', Value: tableName }]
  }))

export const createClient = (opts: CloudWatchClientOpts) => new CloudWatchClient(opts)
