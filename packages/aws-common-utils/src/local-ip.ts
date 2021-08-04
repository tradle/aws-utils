import os from 'os'

export function getLocalIp ({ noEnv }: { noEnv?: boolean } = {}) {
  const envIp = process.env.TRADLE_LOCAL_IP
  if (!noEnv && !!envIp) {
    return envIp
  }
  for (const inter of Object.values(os.networkInterfaces())) {
    for (const item of inter) {
      if (item.family === 'IPv4' && !item.internal) {
        return item.address
      }
    }
  }
  return '127.0.0.1'
}
