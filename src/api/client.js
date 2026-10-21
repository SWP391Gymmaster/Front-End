
export const API_URL = import.meta.env.VITE_API_URL || '/backend'

const SESSION_KEY = 'gm-session'

export const sessionStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY))
    } catch {
      return null
    }
  },
  set(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },
  clear() {
    localStorage.removeItem(SESSION_KEY)
  },
}

export class ApiError extends Error {
  constructor(message, status, details = {}, code = '') {
    super(message)
    this.status = status
    this.details = details
    this.code = code
  }
}

const MESSAGES = {
  'Invalid email or password': 'Email hoặc mật khẩu không đúng',
  'Authentication required': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  'Access denied': 'Bạn không có quyền thực hiện thao tác này',
  'Account is disabled': 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.',
  'Email address has not been verified': 'Email chưa được xác minh. Hãy xác minh email trước khi đăng nhập.',
  'Class has schedules with enrollments': 'Lớp có buổi đã được đăng ký, không thể xóa.',
  'Schedule has enrollments': 'Buổi học đã có người đăng ký, không thể xóa.',
  'Capacity cannot be lower than current enrollment count': 'Sĩ số không được nhỏ hơn số người đã đăng ký.',
  'Coach already has a schedule during this time': 'Coach đã có lịch dạy trong khung giờ này',
  'Room is already booked during this time': 'Phòng tập đã có lớp khác trong khung giờ này',
  'Start time must be before end time': 'Giờ bắt đầu phải trước giờ kết thúc',
  'Start time and end time are required': 'Cần nhập giờ bắt đầu và kết thúc',
  'Class has no coach assigned': 'Lớp chưa được phân công Coach',
  'Coach not found': 'Không tìm thấy Coach',
  'Room is used by existing schedules': 'Phòng đang được dùng trong lịch học, không thể xóa',
  'Class still has schedules, delete them first': 'Lớp vẫn còn lịch học, cần xóa lịch trước',
  'Invalid request data': 'Dữ liệu không hợp lệ',
  'Payment is already completed': 'Giao dịch này đã được thu rồi',
  'Cannot complete a cancelled payment': 'Giao dịch đã hủy, không thể xác nhận',
  'Cannot cancel an already completed payment': 'Giao dịch đã thu, không thể hủy',
  'Payment not found': 'Không tìm thấy giao dịch',
  'Invoice not found': 'Không tìm thấy hóa đơn',
  'Member not found': 'Không tìm thấy hội viên',
  'User is not a member': 'Tài khoản này không phải hội viên',
  'Membership package not found': 'Không tìm thấy gói tập',
  'Membership package is currently inactive': 'Gói tập đang tạm ngưng bán',
  'You are not authorized to pay for this invoice': 'Bạn không có quyền thanh toán hóa đơn này',
  'Membership package is expired or does not cover this class session':
    'Gói tập đã hết hạn hoặc không còn hiệu lực vào ngày học này. Vui lòng mua hoặc gia hạn gói.',
  'Already enrolled in this class session': 'Bạn đã đăng ký buổi học này rồi',
  'Class session is full': 'Buổi học đã đủ chỗ',
  'Class session has already started': 'Buổi học đã bắt đầu, không thể đăng ký hoặc hủy',
  'Schedule not found': 'Không tìm thấy buổi học',
  'Enrollment not found': 'Bạn chưa đăng ký buổi học này',
}

const FIELD_NAMES = {
  userName: 'Tên đăng nhập',
  fullName: 'Họ tên',
  email: 'Email',
  password: 'Mật khẩu',
  name: 'Tên',
  price: 'Học phí',
  durationDays: 'Thời hạn',
  capacity: 'Sức chứa',
  memberId: 'Hội viên',
  packageId: 'Gói tập',
  paymentMethod: 'Phương thức thanh toán',
}

const translate = (data, status) => {
  const msg = data?.message
  if (msg?.startsWith('Room code already exists')) return 'Mã phòng đã được sử dụng.'
  if (msg?.startsWith('Class code already exists')) return 'Mã lớp đã được sử dụng.'
  if (msg?.startsWith('Email already exists')) return 'Email đã được sử dụng'
  if (msg?.startsWith('Username already exists') || msg?.toLowerCase().includes('user name')) {
    return 'Tên đăng nhập đã được sử dụng'
  }
  if (data?.errors) {
    const fields = Object.keys(data.errors).map((f) => FIELD_NAMES[f] || f)
    return 'Dữ liệu không hợp lệ: ' + fields.join(', ')
  }
  if (msg) return MESSAGES[msg] || msg
  if (status === 403) return MESSAGES['Access denied']
  if (status === 404) return 'Không tìm thấy dữ liệu'
  return `Có lỗi xảy ra (mã ${status})`
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  const session = sessionStore.get()
  const headers = { 'Content-Type': 'application/json' }
  if (session?.token) headers.Authorization = 'Bearer ' + session.token

  let res
  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    throw new ApiError(`Không kết nối được Back-End (${API_URL}). Hãy kiểm tra Back-End đã chạy chưa.`, 0)
  }

  if (res.status === 204) return null
  const text = await res.text()
  let data = text
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // Back-End trả về chữ thường (ví dụ /api/test)
  }

  if (!res.ok) {
    if (res.status === 401 && session?.token && sessionStore.get()?.token === session.token && path !== '/auth/login') {
      window.dispatchEvent(new Event('gm:unauthorized'))
    }
    throw new ApiError(translate(data, res.status), res.status, data?.errors || {}, data?.code || '')
  }
  if (typeof data === 'string' && /<(!doctype|html)/i.test(data)) throw new ApiError('Địa chỉ API trả về HTML. Kiểm tra cấu hình proxy.', 0)
  return data
}
