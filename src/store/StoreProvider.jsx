import { useEffect, useState } from 'react'
import { sessionStore } from '../api/client'
import { authApi } from '../api/services'
import { StoreContext } from './context'

const ROLE_MAP = { MANAGER: 'manager', RECEPTIONIST: 'receptionist', COACH: 'coach', MEMBER: 'member' }

const toSession = (res) => ({
  token: res.token,
  userId: res.userId,
  email: res.email,
  name: res.fullName,
  role: ROLE_MAP[res.role] || 'member',
})

const OLD_MOCK_KEYS = ['gm-mock-v2', 'gm-mock-v3', 'gymmaster-demo-v1']

export default function StoreProvider({ children }) {
  const [session, setSession] = useState(sessionStore.get)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    OLD_MOCK_KEYS.forEach((k) => localStorage.removeItem(k))
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      sessionStore.clear()
      setSession(null)
      setNotice('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
    }
    window.addEventListener('gm:unauthorized', onUnauthorized)
    return () => window.removeEventListener('gm:unauthorized', onUnauthorized)
  }, [])

  const startSession = (res) => {
    const s = toSession(res)
    sessionStore.set(s)
    setSession(s)
    setNotice('')
    return s
  }

  const actions = {
    async login(email, password) {
      return startSession(await authApi.login(email.trim(), password))
    },

    async register({ userName, fullName, email, phone, password }) {
      const s = startSession(await authApi.register({ userName, fullName, email: email.trim(), phone, password }))
      setSession({ ...s, newMember: true })
      return s
    },

    logout() {
      sessionStore.clear()
      setSession(null)
    },
    expireSession() {
      sessionStore.clear()
      setSession(null)
      setNotice('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
    },
  }

  return <StoreContext.Provider value={{ session, notice, ...actions }}>{children}</StoreContext.Provider>
}
