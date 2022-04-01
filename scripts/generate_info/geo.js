const fetch = require('node-fetch')

module.exports = async function fetchGeoLocations () {
  const res = await fetch('https://gist.githubusercontent.com/martinheidegger/88950cb51ee5bdeafd51bc55287b1092/raw/aws_regions.json')
  const json = await res.json()
  return json.map(entry => ({
    code: entry.code,
    latitude: entry.lat,
    longitude: entry.long
  }))
}
