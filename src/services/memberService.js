import { addDays, getMembershipStatus, newId, nextMembershipStart, todayISO } from '../store/utils.js'

// API integration boundary. See MEMBER_API.md for DTOs and confirmed vs pending endpoints.
// Replace this factory with an HTTP adapter exposing the same asynchronous methods.
export const MEMBER_API_ROUTES = {
  register: '/auth/register',
  packages: '/api/membership-packages',
  sessions: '/api/member/class-sessions/available',
  enrollments: '/api/member/class-enrollments',
  enrollment: (scheduleId) => `/api/member/class-sessions/${encodeURIComponent(scheduleId)}/enrollment`,
  memberships: null, // TODO: agree membership overview endpoint with BE.
  purchase: null, // TODO: agree purchase/payment endpoint with BE.
}

export function listDemoSessions(state, now = new Date()) {
  const today = todayISO(now)
  const sessions = []
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  for (let offset = 0; offset < 28; offset++) {
    const date = addDays(today, offset)
    const day = weekdays[new Date(`${date}T00:00:00Z`).getUTCDay()]
    for (const cls of state.classes) {
      if (!cls.days.includes(day)) continue
      const id = `${cls.id}:${date}`
      const room = state.rooms.find((item) => item.id === cls.roomId)
      const registeredCount = (state.enrollments || []).filter((e) => e.sessionId === id).length
      sessions.push({
        id, classId: cls.id, name: cls.name, subject: cls.subject, date,
        startTime: `${date}T${cls.start}:00+07:00`, endTime: `${date}T${cls.end}:00+07:00`,
        time: `${cls.start}–${cls.end}`, coachName: state.users.find((u) => u.id === cls.coachId)?.name || '—',
        roomName: room?.name || '—', capacity: Math.min(cls.capacity, room?.capacity ?? cls.capacity), registeredCount,
      })
    }
  }
  return sessions.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function enrollmentEligibility(userId, memberships, enrollments, session, now = new Date()) {
  if (enrollments.some((e) => e.userId === userId && e.sessionId === session.id)) return { allowed: false, reason: 'Bạn đã đăng ký buổi học này.' }
  if (new Date(session.startTime) <= now) return { allowed: false, reason: 'Buổi học đã bắt đầu.' }
  const today = todayISO(now)
  const status = getMembershipStatus(userId, memberships, today)
  if (status.status !== 'active') return { allowed: false, reason: status.status === 'expired' ? 'Gói tập đã hết hạn. Vui lòng gia hạn trước khi đăng ký.' : status.status === 'upcoming' ? 'Gói tập chưa có hiệu lực. Bạn chưa thể đăng ký buổi học.' : 'Bạn cần có gói tập còn hiệu lực để đăng ký.' }
  const covered = memberships.some((m) => m.userId === userId && m.startDate <= session.date && session.date <= m.endDate)
  if (!covered) return { allowed: false, reason: 'Gói tập không bao phủ ngày học này. Vui lòng gia hạn.' }
  if (session.registeredCount >= session.capacity) return { allowed: false, reason: 'Buổi học đã đủ chỗ.' }
  if (enrollments.some((e) => e.userId === userId && new Date(e.session.startTime) < new Date(session.endTime) && new Date(session.startTime) < new Date(e.session.endTime))) return { allowed: false, reason: 'Buổi học trùng với lịch tập đã đăng ký.' }
  return { allowed: true, reason: '' }
}

export function createMemberService({ getState, commit, clock = () => new Date() }) {
  const requireMember = () => {
    const state = getState()
    const user = state.users.find((u) => u.id === state.currentUserId)
    if (user?.role !== 'member') throw new Error('Vui lòng đăng nhập bằng tài khoản hội viên.')
    return { state, user }
  }
  return {
    async register(data) {
      const state = getState()
      const email = data.email.trim().toLowerCase()
      if (state.users.some((u) => u.email?.toLowerCase() === email)) throw new Error('Email đã được sử dụng')
      if (!data.name.trim() || !/^0\d{9}$/.test(data.phone)) throw new Error('Vui lòng kiểm tra họ tên và số điện thoại.')
      if (data.password.length < 8) throw new Error('Mật khẩu tối thiểu 8 ký tự')
      if (!/^[A-Za-z0-9_.-]{3,50}$/.test(data.userName?.trim() || '') || state.users.some((u) => u.userName?.toLowerCase() === data.userName.trim().toLowerCase())) throw new Error('Tên đăng nhập không hợp lệ hoặc đã được sử dụng.')
      const user = { ...data, name: data.name.trim(), userName: data.userName.trim(), email, id: newId('u'), role: 'member' }
      commit({ users: [...state.users, user], currentUserId: user.id })
      return { user }
    },
    async getOverview() {
      const { state, user } = requireMember()
      const now = clock()
      const memberships = state.memberships.filter((m) => m.userId === user.id)
      const enrollments = (state.enrollments || []).filter((e) => e.userId === user.id)
      return {
        user, memberships, enrollments,
        packages: state.packages,
        status: getMembershipStatus(user.id, memberships, todayISO(now)),
        sessions: listDemoSessions(state, now).map((session) => ({ ...session, ...enrollmentEligibility(user.id, memberships, enrollments, session, now) })),
      }
    },
    async purchase({ packageId, method }) {
      const { state, user } = requireMember()
      const pkg = state.packages.find((p) => p.id === packageId && p.active)
      if (!pkg) throw new Error('Gói tập không còn được bán. Vui lòng chọn gói khác.')
      const today = todayISO(clock())
      const startDate = nextMembershipStart(user.id, state.memberships, today)
      const membership = { id: newId('m'), userId: user.id, packageId, startDate, endDate: addDays(startDate, pkg.days - 1) }
      const payment = { id: newId('pay'), invoiceNo: 'HD' + String(state.payments.length + 1).padStart(4, '0'), userId: user.id, packageId, amount: pkg.price, method, date: today, channel: 'Online', staffId: null }
      commit({ memberships: [...state.memberships, membership], payments: [...state.payments, payment] })
      return { membership, payment }
    },
    async enroll(sessionId) {
      const { state, user } = requireMember()
      const now = clock()
      const session = listDemoSessions(state, now).find((s) => s.id === sessionId)
      if (!session) throw new Error('Buổi học không còn khả dụng. Vui lòng tải lại lịch.')
      const enrollments = state.enrollments || []
      const decision = enrollmentEligibility(user.id, state.memberships, enrollments, session, now)
      if (!decision.allowed) throw new Error(decision.reason)
      const enrollment = { id: newId('enrollment'), userId: user.id, sessionId, session, createdAt: now.toISOString() }
      commit({ enrollments: [...enrollments, enrollment] })
      return enrollment
    },
    async cancelEnrollment(sessionId) {
      const { state, user } = requireMember()
      const enrollment = (state.enrollments || []).find((e) => e.sessionId === sessionId && e.userId === user.id)
      if (!enrollment) throw new Error('Không tìm thấy đăng ký buổi học.')
      if (new Date(enrollment.session.startTime) <= clock()) throw new Error('Buổi học đã bắt đầu.')
      commit({ enrollments: state.enrollments.filter((e) => e.id !== enrollment.id) })
    },
  }
}
