export const createRecorder = () => {
  const calls = []
  let startTime
  const dump = () => ({
    start: startTime,
    duration: Date.now() - startTime,
    calls: calls.slice()
  })

  const start = (time = Date.now()) => {
    startTime = time
    calls.length = 0
  }

  const pending = () => {
    const d = dump()
    return {
      ...d,
      calls: d.calls.filter(c => !('duration' in c))
    }
  }

  const stop = () => {
    try {
      return dump()
    } finally {
      startTime = null
      calls.length = 0
    }
  }

  const restart = () => {
    const recordedCalls = dump()
    stop()
    start()
    return recordedCalls
  }

  const addCall = event => {
    if (!startTime) start(event.start)

    calls.push(event)
  }

  const startCall = (props = {}) => (moreProps = {}) =>
    addCall({
      ...props,
      ...moreProps
    })

  return {
    start,
    stop,
    pending,
    restart,
    startCall,
    dump
  }
}
