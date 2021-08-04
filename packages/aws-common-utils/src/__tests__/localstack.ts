import test from 'tape'
import { getLocalIp } from '../local-ip'
import { getLocalStack } from '../localstack'
import { URL } from 'url'

test('getLocalStack', t => {
  const endpoints = getLocalStack()
  const localIp = getLocalIp()
  for (const [name, url] of Object.entries(endpoints)) {
    t.notEquals(name, name.toLowerCase(), `Endpoint ${name} given in UpperCamelCase`)
    const parsed = new URL(url)
    t.equals(parsed.hostname, localIp, `Endpoint ${name} uses local-ip ${localIp}`)
    t.equals(parsed.protocol, 'http:', 'http: protocol given')
    t.notEquals(parsed.port, 0, `Port ${parsed.port} specified`)
  }
  t.end()
})