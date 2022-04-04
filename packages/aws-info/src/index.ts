export { COUNTRIES } from './countries'
export { REGIONS } from './regions'
import { COUNTRIES } from './countries'
import { REGIONS } from './regions'
import { Country, RegionIdx, Region, RegionCode } from './types'

/**
 * Countries mapped by their .idx property
 */
export const COUNTRY_BY_ID = Object.freeze(COUNTRIES.reduce((byId, country) => {
  byId[country.id] = country
  return byId
}, {}) as { [idx: string]: Country })

/**
 * All known/used region codes
 */
export const REGION_CODES = Object.freeze(REGIONS.map(region => region.code) as RegionCode[])

/**
 * Regions mapped by their .idx property
 */
 export const REGION_BY_IDX = Object.freeze(REGIONS.reduce((byIdx, region) => {
  byIdx[region.idx] = region
  return byIdx
}, {}) as { [idx in RegionIdx]: Region })

/**
 * Regions mapped by their .code property
 */
export const REGION_BY_CODE = Object.freeze(REGIONS.reduce((byCode, region) => {
  byCode[region.code] = region
  return byCode
}, {}) as { [code in RegionCode]: Region })


