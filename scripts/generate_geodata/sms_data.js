const fetch = require('node-fetch')
const MarkdownIt = require('markdown-it')

module.exports = async function fetchSMSData () {
  const res = await fetch('https://raw.githubusercontent.com/awsdocs/amazon-sns-developer-guide/main/doc_source/sns-supported-regions-countries.md')
  const [ snsTable, countryTable ] = getMarkdownTables(await res.text())
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

function getMarkdownTables (rawMd) {
  const tokens = (new MarkdownIt()).parse(rawMd)
  const tables = []
  let table = null
  let head = null
  let line = null
  let cell = null
  for (const token of tokens) {
    if (token.type === 'table_open') {
      table = []
    }
    if (token.type === 'tr_open') {
      line = []
    }
    if (token.type === 'td_open' || token.type === 'th_open') {
      cell = ''
    }
    if (cell !== null && token.type === 'inline') {
      cell += token.content.replace(/\\/ig, '')
    }
    if (token.type === 'td_close' || token.type === 'th_close') {
      line.push(cell)
      cell = null
    }
    if (token.type === 'tr_close') {
      if (head === null) {
        head = line
      } else {
        table.push(head.reduce((final, field, index) => {
          final[field] = line[index]
          return final
        }, {}))
      }
      line = null
    }
    if (token.type === 'table_close') {
      tables.push(table)
      head = null
      table = null
    }
  }
  return tables
}
