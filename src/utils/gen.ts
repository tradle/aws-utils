import crypto from 'crypto'

export const randomStatementId = (base: string) => `${base}${crypto.randomBytes(6).toString('hex')}`
