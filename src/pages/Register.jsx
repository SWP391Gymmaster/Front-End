import { useState } from 'react'
import { useStore } from '../store/context'

export default function Register({ onLogin }) {
  const { register } = useStore()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Nam',
    goal: 'Giảm cân',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (!/^0\d{9}$/.test(form.phone)) return setError('Số điện thoại phải gồm 10 số, bắt đầu bằng 0')
    if (form.password.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự')
    if (form.password !== form.confirm) return setError('Mật khẩu xác nhận không khớp')
    const { confirm: _confirm, ...data } = form
    const res = register(data)
    if (!res.ok) setError(res.message)
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="brand big">
          <span className="brand-logo">GM</span>
          <span className="brand-text">GymMaster</span>
        </div>
        <h2>Trở thành hội viên GymMaster</h2>
        <p>Đăng ký tài khoản, chọn gói tập phù hợp và bắt đầu hành trình của bạn ngay hôm nay.</p>
      </div>

      <div className="auth-card">
        <h3>Đăng ký tài khoản</h3>
        <form onSubmit={submit} className="form">
          <label>
            Họ và tên
            <input value={form.name} onChange={set('name')} required placeholder="Nguyễn Văn A" />
          </label>
          <div className="row-2">
            <label>
              Email
              <input type="email" value={form.email} onChange={set('email')} required />
            </label>
            <label>
              Số điện thoại
              <input value={form.phone} onChange={set('phone')} required placeholder="09xxxxxxxx" />
            </label>
          </div>
          <div className="row-2">
            <label>
              Giới tính
              <select value={form.gender} onChange={set('gender')}>
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </label>
            <label>
              Mục tiêu tập luyện
              <select value={form.goal} onChange={set('goal')}>
                <option>Giảm cân</option>
                <option>Tăng cơ</option>
                <option>Giữ dáng</option>
                <option>Cải thiện sức khỏe</option>
              </select>
            </label>
          </div>
          <div className="row-2">
            <label>
              Mật khẩu
              <input type="password" value={form.password} onChange={set('password')} required />
            </label>
            <label>
              Xác nhận mật khẩu
              <input type="password" value={form.confirm} onChange={set('confirm')} required />
            </label>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary full" type="submit">
            Tạo tài khoản
          </button>
        </form>
        <p className="center small">
          Đã có tài khoản?{' '}
          <button className="link" onClick={onLogin}>
            Đăng nhập
          </button>
        </p>
      </div>
    </div>
  )
}
