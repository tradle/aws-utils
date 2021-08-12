import test from 'tape'
import { getLocalIp } from '../local-ip'
import IP from 'ip'

test('getLocalIp', t => {
  const localIp = getLocalIp({ noEnv: true })
  t.ok(IP.isV4Format(localIp), localIp)
  const prevIP = process.env.TRADLE_LOCAL_IP
  delete process.env.TRADLE_LOCAL_IP
  t.equals(getLocalIp(), localIp)
  process.env.TRADLE_LOCAL_IP = 'test'
  t.equals(getLocalIp(), 'test')
  t.equals(getLocalIp({ noEnv: true }), localIp)
  if (prevIP) {
    process.env.TRADLE_LOCAL_IP = prevIP
  } else {
    delete process.env.TRADLE_LOCAL_IP
  }
  t.end()
})