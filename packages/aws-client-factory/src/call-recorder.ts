export const createRecorder = () => {
  const calls: Array<any> = []
  let startTime: number = 0
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
      calls: d.calls.filter((c: any) => !('duration' in c))
    }
  }

  const stop = () => {
    try {
      return dump()
    } finally {
      startTime = 0
      calls.length = 0
    }
  }

  const restart = () => {
    const recordedCalls = dump()
    stop()
    start()
    return recordedCalls
  }

  const addCall = (event: any) => {
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
