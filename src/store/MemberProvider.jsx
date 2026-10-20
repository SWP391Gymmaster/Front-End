import { useEffect, useState, useSyncExternalStore } from 'react'
import { API_URL } from '../api/client'
import { createBackendStore } from '../services/backendStore'
import { StoreContext, useStore } from './context'
import MemberDataState from '../components/MemberDataState'
import PreferencesControls from '../components/PreferencesControls'

// Adapt the Member portal to main's shared authentication session.
// Other roles keep their existing API services, menus and reports.
export default function MemberProvider({ children }) {
  const auth = useStore()
  const [store] = useState(() => {
    const session = auth.session
    const values = new Map([['gymmaster-api-session-v1', JSON.stringify({
      token: session.token,
      user: { id: session.userId, name: session.name, email: session.email, role: session.role },
    })]])
    return createBackendStore({
      baseUrl: API_URL,
      sessionStorage: {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key),
      },
    })
  })
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  useEffect(() => { void store.refresh() }, [store])
  const expired = !state.currentUser
  const endSession = auth.expireSession
  useEffect(() => { if (expired) endSession() }, [expired, endSession])
  if (expired) return null
  return <StoreContext.Provider value={{ ...auth, ...store, ...state, logout: auth.logout }}>
    <div className="member-portal">
      <div className="member-preferences"><PreferencesControls /></div>
      {state.loading || state.loadError
        ? <MemberDataState error={state.loadError} retry={store.refresh} />
        : children}
    </div>
  </StoreContext.Provider>
}
