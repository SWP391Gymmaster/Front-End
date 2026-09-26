
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

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
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

const MESSAGES = {
  'Invalid email or password': 'Email hoặc mật khẩu không đúng',
  'Authentication required': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  'Access denied': 'Bạn không có quyền thực hiện thao tác này',
  'Coach already has a schedule during this time': 'Coach đã có lịch dạy trong khung giờ này',
  'Room is already booked during this time': 'Phòng tập đã có lớp khác trong khung giờ này',
  'Start time must be before end time': 'Giờ bắt đầu phải trước giờ kết thúc',
  'Start time and end time are required': 'Cần nhập giờ bắt đầu và kết thúc',
  'Class has no coach assigned': 'Lớp chưa được phân công Coach',
  'Coach not found': 'Không tìm thấy Coach',
  'Room is used by existing schedules': 'Phòng đang được dùng trong lịch học, không thể xóa',
  'Class still has schedules, delete them first': 'Lớp vẫn còn lịch học, cần xóa lịch trước',
  'Invalid request data': 'Dữ liệu không hợp lệ',
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
}

const translate = (data, status) => {
  const msg = data?.message
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

export async function api(path, { method = 'GET', body } = {}) {
  const session = sessionStore.get()
  const headers = { 'Content-Type': 'application/json' }
  if (session?.token) headers.Authorization = 'Bearer ' + session.token

  let res
  try {
    res = await fetch(API_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
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
    if (res.status === 401 && session?.token) {
      window.dispatchEvent(new Event('gm:unauthorized'))
    }
    throw new ApiError(translate(data, res.status), res.status)
  }
  return data
}
