const MarkdownIt = require('markdown-it')

module.exports = function mdTables (rawMd) {
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
