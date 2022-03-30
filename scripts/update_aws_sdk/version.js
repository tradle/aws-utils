#!/usr/bin/env node
const mdTables = require('../md-tables.js')

const fetch = require('node-fetch')

async function fetchRegions () {
  const res = await fetch('https://raw.githubusercontent.com/awsdocs/aws-lambda-developer-guide/main/doc_source/lambda-runtimes.md')
  const [ nodejs ] = mdTables(await res.text())
  const node14 = nodejs.find(node => node.Identifier === '`nodejs14.x`')
  return node14['SDK for JavaScript']
}

fetchRegions().then(
  v => {
    process.stdout.write(v)
  },
  err => {
    console.error(err.stack)
    process.exit(1)
  }
)
