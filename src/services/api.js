// All Spring controllers share this transport. /backend is proxied by Vite in development.
export class ApiError extends Error {
  // code = thông điệp gốc từ BE (tiếng Anh), dùng để FE nhận diện loại lỗi
  constructor(message, status = 0, details = {}, code = '') { super(message); this.name = 'ApiError'; this.status = status; this.details = details; this.code = code }
}
const errors = {
  'Payment not found': 'Không tìm thấy thanh toán.',
  'Invoice not found': 'Không tìm thấy hóa đơn.',
  'Member not found': 'Không tìm thấy hội viên.',
  'User is not a member': 'Tài khoản này không phải hội viên.',
  'Membership package not found': 'Không tìm thấy gói tập.',
  'Membership package is currently inactive': 'Gói tập hiện ngừng bán.',
  'Payment is already completed': 'Thanh toán đã hoàn tất. Vui lòng tải lại danh sách.',
  'Cannot complete a cancelled payment': 'Không thể xác nhận thanh toán đã hủy.',
  'Cannot cancel an already completed payment': 'Không thể hủy thanh toán đã hoàn tất.',
  'You are not authorized to pay for this invoice': 'Bạn không có quyền thanh toán hóa đơn này.',
  'Access denied to this payment': 'Bạn không có quyền xem thanh toán này.',
  'Access denied to this invoice': 'Bạn không có quyền xem hóa đơn này.',
  'Invalid email or password': 'Email hoặc mật khẩu không đúng',
  'Email address has not been verified': 'Bạn cần xác minh email bằng liên kết trong Gmail trước khi đăng nhập.',
  'Email delivery is not configured': 'Back-End chưa gửi được email xác minh. Hãy kiểm tra cấu hình SMTP Gmail rồi khởi động lại Back-End.',
  'Could not send verification email': 'Chưa gửi được email xác minh. Hãy kiểm tra cấu hình SMTP Gmail ở Back-End.',
  'Please wait before requesting another email': 'Vui lòng đợi một phút trước khi yêu cầu gửi lại email.',
  'Verification email limit reached': 'Đã đạt giới hạn gửi email xác minh. Vui lòng thử lại sau.',
  'Verification link is invalid': 'Liên kết xác minh không hợp lệ hoặc đã được sử dụng.',
  'Verification link has expired': 'Liên kết xác minh đã hết hạn. Hãy yêu cầu gửi email mới.',
  'Authentication required': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'Access denied': 'Bạn không có quyền thực hiện thao tác này.',
  'Invalid request data': 'Dữ liệu không hợp lệ. Vui lòng kiểm tra biểu mẫu.',
  'Membership package is expired or does not cover this class session': 'Bạn chưa mua gói hoặc hiệu lực gói tập không bao gồm buổi học này. Vui lòng mua gói tập!',
  'Class session has already started': 'Buổi học đã bắt đầu.',
  'Already enrolled in this class session': 'Bạn đã đăng ký buổi học này.',
  'Class session is full': 'Buổi học đã đủ chỗ.',
    'Not registered in this class': 'Bạn cần đăng ký lớp trước khi đăng ký buổi học của lớp này.',
  'Already registered in this class': 'Bạn đã đăng ký lớp này.',
  'Class is full': 'Lớp đã đủ sĩ số.',
  'Class registration not found': 'Bạn chưa đăng ký lớp này.',
  'Class registration is not open': 'Lớp chưa mở đăng ký hoặc đã đóng đăng ký.',
  'Class session registration is not open yet': 'Chưa mở đăng ký buổi học. Bạn có thể đăng ký buổi học sau khi thời gian đăng ký sớm kết thúc.',
  'Schedule not found': 'Buổi học không còn khả dụng. Vui lòng tải lại lịch.',
  'Coach already has a schedule during this time': 'Huấn luyện viên bị trùng lịch trong khung giờ này.',
  'Room is already booked during this time': 'Phòng tập bị trùng lịch trong khung giờ này.',
  'Start time must be before end time': 'Giờ kết thúc phải sau giờ bắt đầu.',
  'Start time and end time are required': 'Vui lòng nhập đầy đủ giờ bắt đầu và kết thúc.',
  'Class has no coach assigned': 'Lớp chưa được phân công huấn luyện viên.',
  'Coach not found': 'Không tìm thấy huấn luyện viên.',
  'Schedule has enrollments': 'Không thể xóa buổi học đã có hội viên đăng ký.',
  'Class has schedules with enrollments': 'Không thể xóa lớp đã có hội viên đăng ký.',
  'Class still has schedules, delete them first': 'Hãy xóa các buổi học trước khi xóa lớp.',
  'Capacity cannot be lower than current enrollment count': 'Sĩ số không được nhỏ hơn số hội viên đã đăng ký.',
  'Room code must not be blank': 'Mã phòng không được để trống.',
  'Class code must not be blank': 'Mã lớp không được để trống.',
  'Room is used by existing schedules': 'Phòng đang được dùng trong lịch học, không thể xóa.',
}
// Tầng HTTP dùng chung: gửi JSON, gắn token, đọc response và chuyển lỗi thành ApiError.
// Việc lưu phiên/cập nhật currentUser thuộc backendStore.js, không làm ở file này.
export function createApiClient({ baseUrl = '/backend', getToken = () => null, getSessionVersion = () => 0, onUnauthorized = () => {}, fetchImpl = globalThis.fetch } = {}) {
  return async function request(path, { method = 'GET', body, auth = true, signal } = {}) {
    // Login/Register truyền auth: false nên không gắn Bearer token.
    const token = auth ? getToken() : null
    const sessionVersion = getSessionVersion()
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    let response
    try {
      response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
      })
    } catch (error) {
      if (signal?.aborted) throw error
      throw new ApiError('Không thể kết nối máy chủ. Kiểm tra Back-End và thử lại.')
    }
    // DELETE có thể trả 204 (không có body); các API khác trả JSON hoặc chuỗi.
    const text = response.status === 204 ? '' : await response.text()
    let result
    try { result = text ? JSON.parse(text) : null } catch { result = text }
    if (!response.ok) {
      if (response.status === 401 && token) onUnauthorized(token, sessionVersion)
      const raw = result?.message || result?.error
      let message = errors[raw] || raw
      if (/^Room code already exists/i.test(raw)) message = 'Mã phòng đã tồn tại. Vui lòng chọn mã khác.'
      if (/^Class code already exists/i.test(raw)) message = 'Mã lớp đã tồn tại. Vui lòng chọn mã khác.'
      if (/^Room not found/i.test(raw)) message = 'Không tìm thấy phòng tập.'
      if (/^Class not found/i.test(raw)) message = 'Không tìm thấy lớp học.'
      if (!message || (response.status >= 500 && !errors[raw])) message = response.status === 403 ? errors['Access denied'] : response.status === 401 ? errors['Authentication required'] : 'Yêu cầu thất bại. Vui lòng thử lại.'
      if (/email.*(already|exists)/i.test(message)) message = 'Email đã được sử dụng'
      if (/(username|user name).*(already|exists)/i.test(message)) message = 'Tên đăng nhập không hợp lệ hoặc đã được sử dụng.'
      throw new ApiError(message, response.status, result?.errors || {}, raw || '')
    }
    // A dev-server HTML fallback must never be treated as API data.
    if (typeof result === 'string' && /<(!doctype|html)/i.test(result)) throw new ApiError('Địa chỉ API không hợp lệ. Kiểm tra cấu hình kết nối.')
    return result
  }
}
export function createControllerApi(request) {
  const resource = path => ({
    list: (query = '') => request(path + query),
    get: id => request(`${path}/${encodeURIComponent(id)}`),
    save: (id, body) => request(id ? `${path}/${encodeURIComponent(id)}` : path, { method: id ? 'PUT' : 'POST', body }),
    remove: id => request(`${path}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  })
  return {
    // authenticate('login', body) trong store gọi hàm này.
    // body = { email, password }; trả response BE cho authenticate xử lý tiếp.
    login: body => request('/auth/login', { method: 'POST', body, auth: false }),
    // body = { userName, fullName, email, password, phone }.
    // Store dùng token trong response đăng ký để tạo phiên và mở trang chọn gói.
    register: body => request('/auth/register', { method: 'POST', body, auth: false }),
    health: () => request('/api/test', { auth: false }),
    roleDashboard: role => request(`/${role}/dashboard`),
    packages: resource('/api/membership-packages'), rooms: resource('/api/rooms'), classes: resource('/api/classes'), schedules: resource('/api/schedules'),
    coaches: () => request('/api/coaches'),
    myMemberships: () => request('/api/member/memberships'),
    checkout: body => request('/api/member/payments/checkout', { method: 'POST', body }),
    simulatePayment: id => request(`/api/member/payments/${encodeURIComponent(id)}/simulate-pay`, { method: 'POST' }),
    payments: {
      list: member => request(member ? '/api/member/payments' : '/api/payments'),
      get: (id, member) => request(`${member ? '/api/member/payments' : '/api/payments'}/${encodeURIComponent(id)}`),
      cashCheckout: body => request('/api/payments/cash-checkout', { method: 'POST', body }),
      confirm: (id, body) => request(`/api/payments/${encodeURIComponent(id)}/confirm`, { method: 'POST', body }),
      cancel: (id, reason) => request(`/api/payments/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: { reason } }),
    },
    invoices: {
      list: member => request(member ? '/api/member/invoices' : '/api/invoices'),
      get: (id, member) => request(`${member ? '/api/member/invoices' : '/api/invoices'}/${encodeURIComponent(id)}`),
    },
    availableSessions: () => request('/api/member/class-sessions/available'),
    enrollments: () => request('/api/member/class-enrollments'),
    enroll: id => request(`/api/member/class-sessions/${encodeURIComponent(id)}/enrollment`, { method: 'POST' }),
    cancel: id => request(`/api/member/class-sessions/${encodeURIComponent(id)}/enrollment`, { method: 'DELETE' }),
        // Đăng ký LỚP (cần BE hỗ trợ, bật FEATURES.classRegistration)
      // Đăng ký LỚP (cần BE hỗ trợ, bật FEATURES.classRegistration)
    classStats: () => request('/api/member/classes'),
    registerClass: id => request(`/api/member/classes/${encodeURIComponent(id)}/registration`, { method: 'POST' }),
    cancelClassRegistration: id => request(`/api/member/classes/${encodeURIComponent(id)}/registration`, { method: 'DELETE' }),
  }
}
export const mapPackage = p => ({ ...p, days: p.durationDays })
export const packagePayload = p => ({ name: p.name.trim(), description: p.description || '', price: Number(p.price), durationDays: Number(p.days), active: Boolean(p.active) })
export const mapUser = u => ({ id: u.userId ?? u.id, name: u.fullName, email: u.email, role: u.role.toLowerCase(), phone: u.phone || '' })
export const vietnamTime = value => !value || /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+07:00`
export function mapSession(value, { classes = [], rooms = [], coaches = [], schedules = [] } = {}) {
  const schedule = schedules.find(s => s.id === value.scheduleId) || {}
  const cls = classes.find(c => c.id === value.classId) || {}
  const startTime = value.startTime || schedule.startTime
  const endTime = value.endTime || schedule.endTime
  return {
    id: value.scheduleId ?? value.id, classId: value.classId, name: value.className || cls.name || '—', subject: value.subject || cls.subject || '—',
    date: startTime.slice(0, 10), time: `${startTime.slice(11, 16)}–${endTime.slice(11, 16)}`,
    startTime: vietnamTime(startTime), endTime: vietnamTime(endTime),
    coachName: coaches.find(c => c.id === (value.coachId ?? schedule.coachId))?.name || '—',
    roomName: rooms.find(r => r.id === (value.roomId ?? schedule.roomId))?.name || '—',
    capacity: value.capacity ?? cls.capacity, registeredCount: value.registeredCount, remainingSlots: value.remainingSlots,
    allowed: !value.registeredByMe && value.remainingSlots !== 0 && new Date(vietnamTime(startTime)) > new Date(),
    reason: value.registeredByMe ? 'Bạn đã đăng ký buổi học này.' : value.remainingSlots === 0 ? 'Buổi học đã đủ chỗ.' : '',
  }
}
