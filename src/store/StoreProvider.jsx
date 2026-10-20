import { useEffect, useState, useSyncExternalStore } from 'react'
import { StoreContext } from './context'
import { createBackendStore } from '../services/backendStore'

export default function StoreProvider({ children }) {
  const [store] = useState(() => createBackendStore({ baseUrl: import.meta.env.VITE_API_BASE_URL || '/backend' }))
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => { void store.refresh() }, [store])
  return <StoreContext.Provider value={{ ...store, ...state, apiMode: true }}>{children}</StoreContext.Provider>
}
