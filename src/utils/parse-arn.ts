export const parseArn = (arn: string) => {
  // e.g. arn:aws:lambda:us-east-1:0123456789:function:tradle-dev-http_catchall
  const parts = arn.split(':')
  const relativeId = parts.slice(5).join(':')
  const idParts = relativeId.split('/')
  return {
    service: parts[2],
    region: parts[3],
    accountId: parts[4],
    relativeId,
    type: idParts[0],
    id: idParts.slice(1).join('/')
  }
}

export const getRegionFromArn = (arn: string) => parseArn(arn).region
