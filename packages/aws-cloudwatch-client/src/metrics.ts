export const metrics = {
  dynamodb: {
    consumption: [
      {
        MetricName: 'ConsumedReadCapacityUnits',
        Namespace: 'AWS/DynamoDB'
      },
      {
        MetricName: 'ConsumedWriteCapacityUnits',
        Namespace: 'AWS/DynamoDB'
      }
    ],
    provisioned: [
      {
        MetricName: 'ProvisionedReadCapacityUnits',
        Namespace: 'AWS/DynamoDB'
      },
      {
        MetricName: 'ProvisionedWriteCapacityUnits',
        Namespace: 'AWS/DynamoDB'
      }
    ]
  }
}
