import { Lambda } from 'aws-sdk'
import { CloudFormationClient } from '@tradle/aws-cloudformation-client'
import { LambdaClient } from '@tradle/aws-lambda-client'

export interface GetStackFunctionConfigurationsOpts {
  stackName: string
  cloudformation: CloudFormationClient
  lambda: LambdaClient
}

// export const getStackFunctionConfigurations = async ({
//   cloudformation,
//   lambda,
//   stackName
// }: GetStackFunctionConfigurationsOpts): Promise<AWS.Lambda.Types.FunctionConfiguration[]> => {
//   const [names, configs] = await Promise.all([cloudformation.listStackFunctions(stackName), lambda.listFunctions()])
//   return configs.filter(({ FunctionName }) => names.includes(FunctionName))
// }

export const getStackFunctionConfigurations = async ({
  cloudformation,
  lambda,
  stackName
}: GetStackFunctionConfigurationsOpts): Promise<Lambda.Types.FunctionConfiguration[]> => {
  const names = await cloudformation.listStackFunctions(stackName)
  return Promise.all(names.map(name => lambda.getConfiguration(name)))
}
