import { useEffect, useState } from 'react'
import { seedData } from '../data/seed'
import { StoreContext } from './context'
import { addDays, getMembershipStatus, newId, todayISO } from './utils'

const STORAGE_KEY = 'gymmaster-demo-v1'

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // bỏ qua, dùng dữ liệu mẫu
  }
  return { ...seedData, currentUserId: null }
}

export default function StoreProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const update = (fn) => setState((s) => ({ ...s, ...fn(s) }))

  const currentUser = state.users.find((u) => u.id === state.currentUserId) || null

  const actions = {
    login(email, password) {
      const user = state.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
      )
      if (!user) return { ok: false, message: 'Email hoặc mật khẩu không đúng' }
      update(() => ({ currentUserId: user.id }))
      return { ok: true, user }
    },

    logout() {
      update(() => ({ currentUserId: null }))
    },

    // Member tự đăng ký tài khoản
    register(data) {
      if (state.users.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
        return { ok: false, message: 'Email đã được sử dụng' }
      }
      const user = { ...data, email: data.email.trim(), id: newId('u'), role: 'member' }
      update((s) => ({ users: [...s.users, user], currentUserId: user.id }))
      return { ok: true, user }
    },

    updateProfile(userId, data) {
      update((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, ...data } : u)) }))
    },

    // ---- Center Manager ----
    savePackage(pkg) {
      update((s) => ({
        packages: pkg.id
          ? s.packages.map((p) => (p.id === pkg.id ? pkg : p))
          : [...s.packages, { ...pkg, id: newId('p') }],
      }))
    },
    togglePackage(id) {
      update((s) => ({
        packages: s.packages.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
      }))
    },
    saveRoom(room) {
      update((s) => ({
        rooms: room.id
          ? s.rooms.map((r) => (r.id === room.id ? room : r))
          : [...s.rooms, { ...room, id: newId('r') }],
      }))
    },
    saveClass(cls) {
      update((s) => ({
        classes: cls.id
          ? s.classes.map((c) => (c.id === cls.id ? cls : c))
          : [...s.classes, { ...cls, id: newId('c') }],
      }))
    },
    deleteClass(id) {
      update((s) => ({ classes: s.classes.filter((c) => c.id !== id) }))
    },

    // ---- Mua / gia hạn gói (Member online hoặc Receptionist tại quầy) ----
    purchase({ userId, packageId, method, channel, staffId = null }) {
      const pkg = state.packages.find((p) => p.id === packageId)
      const current = getMembershipStatus(userId, state.memberships)
      const startDate =
        current.status === 'active' ? addDays(current.membership.endDate, 1) : todayISO()
      const membership = {
        id: newId('m'),
        userId,
        packageId,
        startDate,
        endDate: addDays(startDate, pkg.days - 1),
      }
      const payment = {
        id: newId('pay'),
        invoiceNo: 'HD' + String(state.payments.length + 1).padStart(4, '0'),
        userId,
        packageId,
        amount: pkg.price,
        method,
        channel,
        staffId,
        date: todayISO(),
      }
      update((s) => ({
        memberships: [...s.memberships, membership],
        payments: [...s.payments, payment],
      }))
      return { membership, payment }
    },

    // Receptionist đăng ký hội viên mới tại quầy
    registerAtCounter({ name, phone, email, gender, goal, packageId, method, staffId }) {
      if (state.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        return { ok: false, message: 'Email đã tồn tại trong hệ thống' }
      }
      const pkg = state.packages.find((p) => p.id === packageId)
      const user = {
        id: newId('u'),
        role: 'member',
        name,
        phone,
        email: email.trim(),
        gender,
        goal,
        password: '123456',
      }
      const startDate = todayISO()
      const membership = {
        id: newId('m'),
        userId: user.id,
        packageId,
        startDate,
        endDate: addDays(startDate, pkg.days - 1),
      }
      const payment = {
        id: newId('pay'),
        invoiceNo: 'HD' + String(state.payments.length + 1).padStart(4, '0'),
        userId: user.id,
        packageId,
        amount: pkg.price,
        method,
        channel: 'Tại quầy',
        staffId,
        date: startDate,
      }
      update((s) => ({
        users: [...s.users, user],
        memberships: [...s.memberships, membership],
        payments: [...s.payments, payment],
      }))
      return { ok: true, user, membership, payment }
    },

    resetDemo() {
      localStorage.removeItem(STORAGE_KEY)
      setState({ ...seedData, currentUserId: null })
    },
  }

  return (
    <StoreContext.Provider value={{ ...state, currentUser, ...actions }}>
      {children}
    </StoreContext.Provider>
  )
}
