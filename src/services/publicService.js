import { createApiClient } from './api.js'

export const PASSWORD_HINT = '8–72 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.'
export function validateRegistration(form) {
  const errors = {}
  if (!/^[A-Za-z0-9_.]{3,50}$/.test(form.userName.trim())) errors.userName = 'Tên đăng nhập gồm 3–50 ký tự: chữ không dấu, số, dấu _ hoặc .'
  if (form.fullName.trim().length < 2 || form.fullName.trim().length > 100) errors.fullName = 'Họ tên phải có từ 2 đến 100 ký tự.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Vui lòng nhập email hợp lệ.'
  if (!/^0\d{9}$/.test(form.phone.trim())) errors.phone = 'Số điện thoại phải gồm 10 số, bắt đầu bằng 0.'
  if (form.password.length < 8 || new TextEncoder().encode(form.password).length > 72 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password) || !/[^A-Za-z0-9\s]/.test(form.password) || /\s/.test(form.password)) errors.password = 'Mật khẩu cần ít nhất 8 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.'
  if (form.confirm !== form.password) errors.confirm = 'Mật khẩu xác nhận không khớp.'
  return errors
}

export function createPublicService({ baseUrl = '/backend', fetchImpl } = {}) {
  const request = createApiClient({ baseUrl, fetchImpl })
  return {
    async register(form) {
      const fields = validateRegistration(form)
      if (Object.keys(fields).length) throw Object.assign(new Error('Vui lòng kiểm tra thông tin đăng ký.'), { fields })
      const result = await request('/auth/register', { method: 'POST', auth: false, body: {
        userName: form.userName.trim(), fullName: form.fullName.trim(), email: form.email.trim(),
        phone: form.phone.trim(), password: form.password,
      } })
      if (!result?.email || !result?.verificationRequired) throw new Error(result?.message || 'Phản hồi đăng ký từ máy chủ không hợp lệ.')
      return { email: result.email, verificationEmailStatus: result.verificationEmailStatus }
    },
    async packages() {
      const data = await request('/api/membership-packages/active', { auth: false })
      if (!Array.isArray(data)) throw new Error('Dữ liệu danh mục không hợp lệ.')
      return data.filter(p => p.active ?? p.status === 'ACTIVE')
    },
    async verifyEmail(token) {
      if (!token?.trim()) throw new Error('Liên kết xác minh email không có token.')
      return request('/auth/verify-email', { method: 'POST', auth: false, body: { token: token.trim() } })
    },
    async resendVerification(email) {
      const data = await request('/auth/resend-verification', { method: 'POST', auth: false, body: { email: email.trim() } })
      if (!data?.message) throw new Error('Phản hồi gửi lại email từ máy chủ không hợp lệ.')
      return data
    },
  }
}

const env = import.meta.env || {}
export const publicService = createPublicService({
  baseUrl: env.VITE_API_URL || env.VITE_API_BASE_URL || '/backend',
})
