import * as Errors from './errors'
export const regions = [
  'us-east-1',
  'us-east-2',
  'us-west-2',
  'us-west-1',
  'ca-central-1',
  'sa-east-1',
  'amazonaws-us-gov',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-southeast-1',
  'ap-northeast-1',
  'ap-northeast-3',
  'ap-southeast-2',
  'ap-northeast-2',
  'ap-south-1',
  'cn-north-1',
  'cn-northwest-1'
]

export const validateRegion = (region: string, againstRegions: string[] = regions) => {
  if (!againstRegions.includes(region)) {
    throw new Errors.InvalidOption(`region is not supported: ${region}`)
  }
}
