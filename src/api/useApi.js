import { useCallback, useEffect, useRef, useState } from 'react'

// deps contains stable primitive query keys (for example a coach ID).
// Keep the latest committed loader without restarting for each inline function render.
export default function useApi(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const loaderRef = useRef(loader)
  const generation = useRef({ value: 0 })
  const queryKey = JSON.stringify(deps)
  useEffect(() => { loaderRef.current = loader })
  const reload = useCallback(async () => {
    const id = ++generation.current.value
    setState(previous => ({ ...previous, loading: true, error: '' }))
    try {
      const data = await loaderRef.current()
      if (id === generation.current.value) setState({ data, loading: false, error: '' })
    } catch (error) {
      if (id === generation.current.value) setState(previous => ({ ...previous, loading: false, error: error.message }))
    }
  }, [])
  useEffect(() => {
    const tracker = generation.current
    void reload()
    return () => { tracker.value++ }
  }, [reload, queryKey])
  return { ...state, reload }
}
