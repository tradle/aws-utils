import { CloudFormationClient } from '@tradle/aws-cloudformation-client'
import { LambdaClient } from '@tradle/aws-lambda-client'
import { Lambda } from 'aws-sdk'
import { Errors } from '@tradle/aws-common-utils'
export type TransformFunctionConfig = (conf: Lambda.Types.FunctionConfiguration) => any
interface CommonOpts {
  cloudformation: CloudFormationClient
  lambda: LambdaClient
}

export interface UpdateLambdaEnvironmentsOpts extends CommonOpts {
  map: TransformFunctionConfig
}

export interface UpdateLambdaEnvironmentOpts extends CommonOpts {
  functionName: string
  current?: Lambda.FunctionConfiguration
  update: any
}
export interface UpdateEnvResult {
  functionName: string
  result?: any
  error?: Error
}

export const updateLambdaEnvironments = async ({
  cloudformation,
  lambda,
  map
}: UpdateLambdaEnvironmentsOpts): Promise<UpdateEnvResult[]> => {
  const functions = await cloudformation.getStackFunctionConfigurations()
  if (!functions) return

  const writes: Array<Promise<UpdateEnvResult>> = functions
    .map(current => {
      const update = map(current)
      if (!update) return

      return {
        current,
        update,
        functionName: current.FunctionName
      }
    })
    .filter(e => !!e)
    .map(updateOpts => updateLambdaEnvironment({ cloudformation, lambda, ...updateOpts }))

  return Promise.all(writes)
}

export const updateLambdaEnvironment = async ({
  cloudformation,
  lambda,
  current,
  update,
  functionName
}: UpdateLambdaEnvironmentOpts): Promise<UpdateEnvResult> => {
  const ret: UpdateEnvResult = {
    functionName
  }

  try {
    ret.result = await lambda.updateEnvironment({ current, update, functionName })
  } catch (err) {
    Errors.ignoreNotFound(err)
    ret.error = new Errors.NotFound(err.message)
  }

  return ret
}
