import AWS from 'aws-sdk'
import { getCurrentCallStack } from './errors'
import { createRecorder } from './call-recorder'
// import { Logger } from './types'

const IGNORE_METHODS = ['makeRequest']
const LENGTH_THRESHOLD_MS = 1000

// Object.keys misses inherited keys
const getKeys = obj => {
  const keys = []
  for (const p in obj) {
    keys.push(p)
  }

  return keys
}

interface MonitorOpts {
  client: AWS.Service
  logger: any
}

export const monitor = ({ client, logger }: MonitorOpts) => {
  // @ts-ignore
  const clientName = client.serviceIdentifier || client.constructor.name
  const recorder = createRecorder()
  const wrapper = {
    $startRecording: recorder.start,
    $restartRecording: recorder.restart,
    $stopRecording: recorder.stop,
    $dumpRecording: recorder.dump,
    $getPending: recorder.pending
  }

  const keys = getKeys(client)
  keys.forEach(key => {
    const orig = client[key]
    if (typeof orig !== 'function' || IGNORE_METHODS.includes(key)) {
      Object.defineProperty(wrapper, key, {
        get() {
          return client[key]
        },
        set(value) {
          return (client[key] = value)
        }
      })

      return
    }

    wrapper[key] = function(...args) {
      const start = Date.now()
      const end = recorder.startCall({
        client: clientName,
        method: key,
        args,
        start,
        stack: getCurrentCallStack(3)
      })

      const onFinished = (error?, opResult?) => {
        const endParams: any = {
          duration: Date.now() - start
        }

        if (error) {
          endParams.error = error
        }

        if (endParams.duration > LENGTH_THRESHOLD_MS) {
          logger.silly(`aws ${clientName} call took ${endParams.duration}ms`, endParams)
        }

        end(endParams)
        if (callback) return callback(error, opResult)
        if (error) throw error
        return opResult
      }

      const onSuccess = opResult => onFinished(null, opResult)
      const lastArg = args[args.length - 1]
      let callback
      if (typeof lastArg === 'function') {
        callback = lastArg
        args[args.length - 1] = onFinished
      }

      let result
      try {
        result = orig.apply(this, args)
        if (!callback && result && result.promise) {
          const { promise } = result
          if (promise) {
            result.promise = () => promise.call(result).then(onSuccess, onFinished)
          }
        }

        return result
      } catch (err) {
        onFinished(err)
        throw err
      }
    }
  })

  return wrapper
}
