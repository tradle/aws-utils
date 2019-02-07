import pino from 'pino'

type LogFn = (...args: any[]) => void

export interface Logger {
  debug: LogFn
  info: LogFn
  warn: LogFn
  error: LogFn
  fatal: LogFn
  trace?: LogFn

  // make @tradle/dynamodb happy
  silly: LogFn
  log: LogFn
}

export const createLogger = (opts: pino.LoggerOptions = {}) => {
  const logger: unknown = pino({
    useLevelLabels: true,
    customLevels: {
      // make @tradle/dynamodb happy
      silly: 0,
      log: 20 // same as info
    },
    ...opts
  })

  return logger as Logger
}

const noop = (...args: any[]) => {}
export const createNoopLogger = (): Logger => ({
  fatal: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  log: noop,
  trace: noop,
  silly: noop
})
