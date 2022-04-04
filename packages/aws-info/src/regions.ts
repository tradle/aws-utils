// Generated by "npm run generate_info" in tradle/aws-utils repository
import { Region } from './types'
import { coord, deepFreeze } from './util'

/**
 * Known geographical locations of aws regions
 */
export const REGIONS = deepFreeze([
  {
    code: 'us-east-1',
    idx: '0',
    loc: coord(38.99, -77.45)
  },
  {
    code: 'us-east-2',
    idx: '1',
    loc: coord(40.09, -82.75)
  },
  {
    code: 'us-west-1',
    idx: '2',
    loc: coord(37.44, -122.15)
  },
  {
    code: 'us-west-2',
    idx: '3',
    loc: coord(45.92, -119.27)
  },
  {
    code: 'ca-central-1',
    idx: '4',
    loc: coord(45.5, -73.6)
  },
  {
    code: 'ap-south-1',
    idx: '5',
    loc: coord(19.24, 72.97)
  },
  {
    code: 'ap-northeast-1',
    idx: '6',
    loc: coord(35.62, 139.75)
  },
  {
    code: 'ap-northeast-2',
    idx: '7',
    loc: coord(37.56, 126.87)
  },
  {
    code: 'ap-northeast-3',
    idx: '8',
    loc: coord(34.69, 135.5)
  },
  {
    code: 'ap-southeast-1',
    idx: '9',
    loc: coord(1.32, 103.69)
  },
  {
    code: 'ap-southeast-2',
    idx: 'a',
    loc: coord(-33.91, 151.19)
  },
  {
    code: 'cn-north-1',
    idx: 'b',
    loc: coord(39.81, 116.58),
    fallback: {
      ses: 'ap-northeast-2'
    }
  },
  {
    code: 'cn-northwest-1',
    idx: 'c',
    loc: coord(37.5, 105.16),
    fallback: {
      ses: 'ap-northeast-2'
    }
  },
  {
    code: 'eu-central-1',
    idx: 'd',
    loc: coord(50.1, 8.63)
  },
  {
    code: 'eu-west-1',
    idx: 'e',
    loc: coord(53.41, -6.22)
  },
  {
    code: 'eu-west-2',
    idx: 'f',
    loc: coord(51.51, -0.06)
  },
  {
    code: 'eu-west-3',
    idx: 'g',
    loc: coord(48.6, 2.3)
  },
  {
    code: 'eu-north-1',
    idx: 'h',
    loc: coord(59.33, 17.84)
  },
  {
    code: 'ap-east-1',
    idx: 'i',
    loc: coord(22.29, 114.27),
    fallback: {
      ses: 'ap-northeast-2'
    }
  },
  {
    code: 'sa-east-1',
    idx: 'j',
    loc: coord(-23.49, -46.81)
  },
  {
    code: 'me-south-1',
    idx: 'k',
    loc: coord(25.94, 50.31)
  },
  {
    code: 'ap-southeast-3',
    idx: 'l',
    loc: coord(-6.2, 106.82),
    fallback: {
      ses: 'ap-southeast-1'
    }
  },
  {
    code: 'us-gov-west-1',
    idx: 'm',
    loc: null
  },
  {
    code: 'eu-south-1',
    idx: 'n',
    loc: coord(45.46, 9.11)
  },
  {
    code: 'af-south-1',
    idx: 'p',
    loc: coord(-33.91, 18.38)
  }
] as Region[])
