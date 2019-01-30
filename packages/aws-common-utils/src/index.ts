import * as constants from './constants'
import * as Errors from './errors'

export { constants, Errors }
export * from './url'
export * from './props'
export * from './errors'
export * from './arn'
export * from './crypto'
export * from './strings'
export * from './gen'
// interface BatchProcessOpts {
//   data: any[]
//   batchSize: number
//   processOne?: (item: any, index: number) => Promise<any>
//   processBatch?: (batch: any[], index: number) => Promise<any>
//   settle?: boolean
// }
