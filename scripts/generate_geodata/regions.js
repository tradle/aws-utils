const fetch = require('node-fetch')

module.exports = async function fetchRegions () {
  const res = await fetch('https://gist.githubusercontent.com/atyachin/a011edf76df66c5aa1eac0cdca412ea9/raw/aws_regions.json')
  const json = await res.json()
  return json
    // Removing Chinese Regions as they are not really on aws.
    .filter(entry => !/^cn-/.test(entry.code))
    .map(entry => {
      return {
        code: entry.code,
        latitude: entry.lat,
        longitude: entry.long
      }
    })
}
