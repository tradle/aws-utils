const mdTables = require('../md-tables.js')
const fetch = require('node-fetch')

module.exports = async function fetchSMSData () {
  const res = await fetch('https://raw.githubusercontent.com/awsdocs/amazon-sns-developer-guide/main/doc_source/sns-supported-regions-countries.md')
  const [ snsTable, countryTable ] = mdTables(await res.text())
  const smsRegions = snsTable.map(entry => entry.Region)
  const idToService = countryTable.reduce((idToService, entry) => {
    const { 'ISO code': isoCode, 'Supports sender IDs': senderID, 'Supports two-way SMS (Amazon Pinpoint only)': twoWaySMS } = entry
    idToService[isoCode] = {
      senderID: senderID === 'Yes' ? 1 : senderID == '' ? 0 : 2,
      twoWaySMS: twoWaySMS === 'Yes'
    }
    return idToService
  }, {})
  return {
    smsRegions, idToService
  }
}
