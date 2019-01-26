import AWS from 'aws-sdk'

export const services = {
	S3: AWS.S3,
	DynamoDB: AWS.DynamoDB,
	DynamoDBStreams: AWS.DynamoDBStreams,
	DocumentClient: AWS.DynamoDB.DocumentClient,
	IAM: AWS.IAM,
	Iot: AWS.Iot,
	STS: AWS.STS,
	SNS: AWS.SNS,
	SES: AWS.SES,
	KMS: AWS.KMS,
	Lambda: AWS.Lambda,
	IotData: AWS.IotData,
	XRay: AWS.XRay,
	APIGateway: AWS.APIGateway,
	CloudWatch: AWS.CloudWatch,
	CloudWatchLogs: AWS.CloudWatchLogs,
	SSM: AWS.SSM,
	CloudFormation: AWS.CloudFormation
}
