import IP from 'ip'
import { parse as parseURL } from 'url'

export const isLocalUrl = (url: string) => {
  const { hostname } = parseURL(url)
  return isLocalHost(hostname)
}

export const isLocalHost = (host: string) => {
  host = host.split(':')[0]
  if (host === 'localhost') return true

  const isIP = IP.isV4Format(host) || IP.isV6Format(host)
  return isIP && IP.isPrivate(host)
}
