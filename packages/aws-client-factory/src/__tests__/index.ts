#!/usr/bin/env npx ts-node
import path from 'path'
import fs from 'fs'

fs.readdirSync(__dirname).forEach(file => {
  if (file.endsWith(path.extname(__filename))) {
    require(path.join(__dirname, file))
  }
})
