import { useCallback, useEffect, useState } from 'react'

export default function useApi(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })

  const load = useCallback(loader, deps)

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const data = await load()
      setState({ data, loading: false, error: '' })
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }))
    }
  }, [load])

  useEffect(() => {
    let cancelled = false
    load()
      .then((data) => !cancelled && setState({ data, loading: false, error: '' }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: e.message }))
    return () => {
      cancelled = true
    }
  }, [load])

  return { ...state, reload }
}
