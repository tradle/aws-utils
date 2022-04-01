export { countries } from './countries'
export { regions } from './regions'
import { countries } from './countries'
import { regions } from './regions'
import { Country, RegionIdx, Region, RegionCode } from './types'

/**
 * Countries mapped by their .idx property
 */
export const countryById = Object.freeze(countries.reduce((byId, country) => {
  byId[country.id] = country
  return byId
}, {}) as { [idx: string]: Country })

/**
 * All known/used region codes
 */
export const regionCodes = Object.freeze(regions.map(region => region.code) as RegionCode[])

/**
 * Regions mapped by their .idx property
 */
 export const regionByIdx = Object.freeze(regions.reduce((byIdx, region) => {
  byIdx[region.idx] = region
  return byIdx
}, {}) as { [idx in RegionIdx]: Region })

/**
 * Regions mapped by their .code property
 */
export const regionByCode = Object.freeze(regions.reduce((byCode, region) => {
  byCode[region.code] = region
  return byCode
}, {}) as { [code in RegionCode]: Region })


