import { info } from '@tradle/aws-info'
import type { RegionCode, Region } from '@tradle/aws-info'
import aws from 'aws-sdk'

const DEFAULT_REGION = info.regionByCode['us-east-1']

export const currentRegion = Object.freeze({
  get info (): Region {
    const code = aws.config.region
    if (code === undefined) {
      return DEFAULT_REGION
    }
    return info.regionByCode[code] ?? DEFAULT_REGION

  },
  get code (): RegionCode {
    return currentRegion.info.code
  }
})
