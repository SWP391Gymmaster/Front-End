import { useState } from 'react'
import { useStore } from '../store/context'

export default function Register({ onLogin }) {
  const { register } = useStore()
  const [form, setForm] = useState({
    fullName: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    if (!/^[a-zA-Z0-9_.]{3,}$/.test(form.userName)) {
      return setError('Tên đăng nhập tối thiểu 3 ký tự, chỉ gồm chữ không dấu, số, dấu _ hoặc .')
    }
    if (!/^0\d{9}$/.test(form.phone)) return setError('Số điện thoại phải gồm 10 số, bắt đầu bằng 0')
    if (form.password.length < 8) return setError('Mật khẩu tối thiểu 8 ký tự')
    if (form.password !== form.confirm) return setError('Mật khẩu xác nhận không khớp')
    setError('')
    setLoading(true)
    try {
      await register(form)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
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
            <input value={form.fullName} onChange={set('fullName')} required placeholder="Nguyễn Văn A" />
          </label>
          <div className="row-2">
            <label>
              Tên đăng nhập
              <input value={form.userName} onChange={set('userName')} required placeholder="nguyenvana" />
            </label>
            <label>
              Số điện thoại
              <input value={form.phone} onChange={set('phone')} required placeholder="09xxxxxxxx" />
            </label>
          </div>
          <label>
            Email
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
          <div className="row-2">
            <label>
              Mật khẩu (tối thiểu 8 ký tự)
              <input type="password" value={form.password} onChange={set('password')} required />
            </label>
            <label>
              Xác nhận mật khẩu
              <input type="password" value={form.confirm} onChange={set('confirm')} required />
            </label>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary full" type="submit" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
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
