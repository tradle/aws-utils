#!/usr/bin/env node
const fetchGeoData = require('./geo.js')
const fetchSMSData = require('./sms_data.js')
const fs = require('fs/promises')
const countries = require('world-countries')
const { stringify } = require('javascript-stringify')
const awsRegionData = require('aws-region-table-parser')
const intersection = require('lodash/intersection')
const haversine = require('haversine')

const HEADER = '// Generated by "npm run generate_info" in tradle/aws-utils repository'

function twoDigits (num) {
  return Math.round(num * 100) / 100
}

function replacer (value, _space, next, key) {
  if (key === 'senderID') {
    return `SenderID.${((value === 0) ? 'Unavailable' : (value === 1) ? 'Available' : 'PreRequisitesRequired')}`
  }
  if (key === 'partition') {
    return `Partition.${((value === 'cn') ? 'China' : (value === 'us-gov') ? 'UsGov' : 'Default')}`
  }
  if (typeof value === 'object') {
    if (value !== null && typeof value.latitude === 'number' && typeof value.longitude === 'number') {
      return `coord(${twoDigits(value.latitude)}, ${twoDigits(value.longitude)})`
    }
    return `${next(value)}`
  }
  return next(value)
}

const prettify = obj => stringify(obj, replacer, 2)

async function fetchCached (cacheFile, operation) {
  try {
    const data = await operation()
    await fs.writeFile(cacheFile, JSON.stringify(data, null, 2))
    return data
  } catch (err) {
    console.warn(`[WARN] Falling back to "${cacheFile}" as the data could not be loaded: \n    ${err.stack.toString().split('\n').join('\n    ')}`)
    return JSON.parse(await fs.readFile(cacheFile, 'utf-8'))
  }
}

// TODO: Remove after upgrading world-countries to > 4.0.0
function callingCodes (idd) {
  const base = idd.root.substr(1)
  return idd.suffixes.map(suffix => `${base}${suffix.replace(/X+$/, '')}`)
}

async function writeTs (name, body) {
  await fs.writeFile(`${__dirname}/../../packages/aws-info/src/${name}.ts`, `${HEADER}${body}`)
}

const orderFile = `${__dirname}/regions-order.json`
async function tradleSupportedRegions () {
  const { services } = await awsRegionData.get()
  // For MyCloud/tradle to work on AWS we need to have lambdas/dynamodb/s3
  const supported = intersection(
    services.lambda.regions,
    services.dynamodb.regions, 
    services.s3.regions
  )

  // It is important that the region data keeps the correct order
  const known = JSON.parse(await fs.readFile(orderFile))
  for (const region of supported) {
    if (!known.includes(region)) {
      // ... so we append unknown regions at the end ...
      known.push(region)
    }
  }
  // ... and store them for future processing
  await fs.writeFile(orderFile, JSON.stringify(known, null, 2))

  return {
    supported,
    known 
  }
}

function findNearest (loc, haystack) {
  if (haystack.length === 0) {
    throw new Error('List needs to have at least one element')
  }
  let nearestDistance = Number.MAX_VALUE
  let nearest
  for (const hay of haystack) {
    const distance = haversine(loc, hay, {})
    if (nearest === undefined || nearestDistance > distance) {
      nearest = hay
      nearestDistance = distance
    }
  }
  return nearest
}

function collectFallbacks (region, supports) {
  let fallback = null
  for (const [name, regions] of Object.entries(supports)) {
    if (!regions.includes(region)) {
      if (fallback === null) {
        fallback = {}
      }
      const lookup = regions
        .filter(({ code, partition }) => code !== region.code && partition === region.partition)
        .map(({ loc }) => loc)
      fallback[name] = region.loc && lookup.length ? findNearest(
        region.loc,
        lookup
      ).code : null
    }
  }
  return fallback
}

async function getRegions (geoData) {
  const { services } = await awsRegionData.get()
  const { known } = await tradleSupportedRegions()
  const regions = []
  const regionByCode = {}

  for (const code of known) {
    const region = {
      code,
      partition: code.startsWith('cn-') ? 'cn' : code.startsWith('us-gov') ? 'us-gov' : '*',
      idx: known.indexOf(code).toString(36),
      loc: geoData.find(entry => entry.code === code) || null
    }
    regionByCode[code] = region
    regions.push(region)
  }

  const fallbackRegions = {
    ses: services.ses.regions.map(code => regionByCode[code]),
    sns: services.sns.regions.map(code => regionByCode[code])
  }

  for (const region of regions) {
    const fallback = collectFallbacks(region, fallbackRegions)
    if (fallback) {
      if (!region.loc) {
        console.log(`Ignoring AWS region "${region.code}" as we do not know it's location and it doesn't support: ${Object.keys(fallback)}`)
        continue
      }
      region.fallback = fallback
    }
  }

  return `/**
 * Known geographical locations of aws regions
 */
export const getRegions = () => ${prettify(regions)} as Region[]
`
}

async function getCountries (smsData) {
  const data = []
  let longestCallingCode = 0
  for (const country of countries) {
    const id = country.cca2
    const sms = smsData.idToService[id]
    const miniCountry = {
      id,
      cca3: country.cca3,
      callingCodes: callingCodes(country.idd),
      title: country.name.common,
      loc: {
        latitude: country.latlng[0],
        longitude: country.latlng[1]
      }
    }
    if (sms) {
      miniCountry.sms = sms
    }
    for (const callingCode of miniCountry.callingCodes) {
      longestCallingCode = Math.max(longestCallingCode, callingCode.length)
    }
    data.push(miniCountry)
  }
  return `/**
 * Information about the world's countries, including aws information
 */
export const getCountries = () => ${prettify(data)} as Country[]
export const LONGEST_CALLING_CODE = ${longestCallingCode}
`
}

async function updateData (geoData, smsData) {
  await writeTs('data', `
import { SenderID, Partition } from './types'
import type { Country, Region, Coordinates } from './types'

const coord = (latitude: number, longitude: number): Coordinates => ({
  latitude,
  longitude
})

${await getCountries(smsData)}
${await getRegions(geoData)}
`)
}

async function updateTypes () {
  const { known } = await tradleSupportedRegions()
  await writeTs('types', `
export type RegionCode = ${known.map(name => `'${name}'`).join(' | ')}
export type RegionIdx = ${known.map((_name, id) => `'${id.toString(36)}'`).join(' | ')}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface OnMap {
  loc: Coordinates
}

export enum Partition {
  Default = '*',
  UsGov = 'us-gov',
  China = 'cn'
}

export interface Region extends Partial<OnMap> {
  /**
   * Code as used in AWS
   */
  code: RegionCode

  /**
    * Short code used for suffix alike.
    * Fixed to never change
    */
  idx: RegionIdx

  /**
   * An AWS Region is always part of a group aka. partition
   */
  partition: Partition

  /**
   * Nearest fallback regions
   */
  fallback?: {
    readonly [type in 'ses' | 'sns']: RegionCode
  }
}

export enum SenderID {
  Unavailable = 0,
  Available = 1,
  PreRequisitesRequired = 2
}

export interface CountrySMS {
  readonly senderID: SenderID
  readonly twoWaySMS: boolean
}

export interface Country extends OnMap {
  id: string
  cca3: string
  callingCodes: readonly string[]
  title: string
  sms?: CountrySMS
}
`)
}

async function main () {
  const [geoData, smsData] = await Promise.all([
    fetchCached(`${__dirname}/geo.backup.json`, fetchGeoData),
    fetchCached(`${__dirname}/sms_data.backup.json`, fetchSMSData)
  ])
  await Promise.all([
    updateData(geoData, smsData),
    updateTypes()
  ])
  return
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})