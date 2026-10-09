import { useEffect, useState } from 'react'
import { sessionStore } from '../api/client'
import { authApi } from '../api/services'
import { StoreContext } from './context'
import { addDays, getMembershipStatus, newId, todayISO } from './utils'

// ============================================================
// DỮ LIỆU TẠM (MOCK): các chức năng Back-End CHƯA có API
//   - hội viên đã đăng ký, gói tập đã mua, thanh toán, hóa đơn
// Lưu trong localStorage của trình duyệt. Khi Back-End có API
// thì thay các hàm purchase / addMember bằng lời gọi API tương ứng.
// ============================================================
const MOCK_KEY = 'gm-mock-v2'

const MOCK_SEED = {
  members: [
    { email: 'member@example.com', fullName: 'Demo Member', phone: '0900000003', createdAt: todayISO() },
  ],
  memberships: [],
  payments: [],
}

const loadMock = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(MOCK_KEY))
    if (saved) return saved
  } catch {
    // dùng dữ liệu mẫu
  }
  return MOCK_SEED
}

const ROLE_MAP = { MANAGER: 'manager', RECEPTIONIST: 'receptionist', COACH: 'coach', MEMBER: 'member' }

const toSession = (res) => ({
  token: res.token,
  userId: res.userId,
  email: res.email,
  name: res.fullName,
  role: ROLE_MAP[res.role] || 'member',
})

export default function StoreProvider({ children }) {
  const [session, setSession] = useState(sessionStore.get)
  const [mock, setMock] = useState(loadMock)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    localStorage.setItem(MOCK_KEY, JSON.stringify(mock))
  }, [mock])

  // Token hết hạn / không hợp lệ -> đăng xuất
  useEffect(() => {
    const onUnauthorized = () => {
      sessionStore.clear()
      setSession(null)
      setNotice('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
    }
    window.addEventListener('gm:unauthorized', onUnauthorized)
    return () => window.removeEventListener('gm:unauthorized', onUnauthorized)
  }, [])

  const upsertMember = (m) =>
    setMock((s) => ({
      ...s,
      members: s.members.some((x) => x.email === m.email)
        ? s.members.map((x) => (x.email === m.email ? { ...x, ...m } : x))
        : [...s.members, { createdAt: todayISO(), ...m }],
    }))

  const startSession = (res, extra = {}) => {
    const s = { ...toSession(res), ...extra }
    sessionStore.set(s)
    setSession(s)
    setNotice('')
    if (s.role === 'member') {
      upsertMember({
        userId: s.userId,
        email: s.email,
        fullName: s.name,
        ...(extra.phone ? { phone: extra.phone } : {}),
      })
    }
    return s
  }

  const actions = {
    // ---------- API thật ----------
    async login(email, password) {
      const res = await authApi.login(email.trim(), password)
      return startSession(res)
    },

    async register({ userName, fullName, email, phone, password }) {
      const res = await authApi.register({ userName, fullName, email: email.trim(), phone, password })
      return startSession(res, { phone })
    },

    logout() {
      sessionStore.clear()
      setSession(null)
    },

    // ---------- Dữ liệu tạm ----------
    addMember: upsertMember,

    // Mua / gia hạn gói. pkg là object gói lấy từ API.
    purchase({ email, pkg, method, channel, staffName = null }) {
      const current = getMembershipStatus(email, mock.memberships)
      const startDate = current.status === 'active' ? addDays(current.membership.endDate, 1) : todayISO()
      const membership = {
        id: newId('m'),
        email,
        packageId: pkg.id,
        packageName: pkg.name,
        startDate,
        endDate: addDays(startDate, pkg.durationDays - 1),
      }
      const payment = {
        id: newId('pay'),
        invoiceNo: 'HD' + String(mock.payments.length + 1).padStart(4, '0'),
        email,
        packageName: pkg.name,
        amount: pkg.price,
        method,
        channel,
        staffName,
        date: todayISO(),
        startDate: membership.startDate,
        endDate: membership.endDate,
      }
      setMock((s) => ({
        ...s,
        memberships: [...s.memberships, membership],
        payments: [...s.payments, payment],
      }))
      return { membership, payment }
    },

    resetMock() {
      localStorage.removeItem(MOCK_KEY)
      setMock(MOCK_SEED)
    },
  }

  return (
    <StoreContext.Provider value={{ session, notice, ...mock, ...actions }}>
      {children}
    </StoreContext.Provider>
  )
}
