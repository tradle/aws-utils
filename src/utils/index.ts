import * as Errors from '../errors'
import * as constants from '../constants'

export * from './parse-arn'
export * from './props'
export * from './geo'
export * from './gen'

export const validateRegion = (region: string, againstRegions: string[] = constants.REGIONS) => {
  if (!againstRegions.includes(region)) {
    throw new Errors.InvalidOption(`region is not supported: ${region}`)
  }
}
