import Errors from '@tradle/errors'
import { CloudFormationClient } from '@tradle/aws-cloudformation-client'
import { LambdaClient } from '@tradle/aws-lambda-client'
import { updateLambdaEnvironments, updateLambdaEnvironment } from './update-environments'

interface CommonOpts {
  cloudformation: CloudFormationClient
  lambda: LambdaClient
}
interface ReinitializeContainersOpts extends CommonOpts {
  functions?: string[]
}

interface ReinitializeContainerOpts extends CommonOpts {
  functionName: string
}

export const reinitializeContainers = async (opts: ReinitializeContainersOpts) => {
  const { functions, ...updateEnvironmentsOpts } = opts
  const results = await updateLambdaEnvironments({
    ...updateEnvironmentsOpts,
    map: ({ FunctionName }) => {
      if (!functions || functions.includes(FunctionName)) {
        // this.logger.debug(`reinitializing container for lambda: ${FunctionName}`)
        return getDateUpdatedEnvironmentVariables()
      }

      // this.logger.debug(`not reinitializing container for lambda: ${FunctionName}`)
    }
  })

  const failed = results.filter(r => r.error)
  if (!failed.length) return

  const err = new Errors.BatchOpError('failed to update some or all lambda environment variables')
  err.errors = failed.map(r => r.error)
  throw err

  // this.logger.error('failed to update some containers', {
  //   failed: failed.map(({ functionName, error }) => ({
  //     functionName,
  //     error: error.message
  //   }))
  // })
}

export const reinitializeContainer = async ({ functionName, ...updateOpts }: ReinitializeContainerOpts) => {
  // this.logger.debug(`reinitializing container for lambda: ${functionName}`)
  await updateLambdaEnvironment({
    ...updateOpts,
    functionName,
    update: getDateUpdatedEnvironmentVariables()
  })
}

const getDateUpdatedEnvironmentVariables = () => ({
  DATE_UPDATED: String(Date.now())
})
