import { useState } from 'react'
import { ROLE_LABELS } from '../store/roles'
import { useStore } from '../store/context'

const DEMO_ACCOUNTS = [
  { email: 'manager@example.com', role: 'manager' },
  { email: 'receptionist@example.com', role: 'receptionist' },
  { email: 'coach@example.com', role: 'coach' },
  { email: 'member@example.com', role: 'member' },
]
const DEMO_PASSWORD = 'password123'

export default function Login({ onRegister }) {
  const { login, notice, resetMock } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const fillDemo = (acc) => {
    setEmail(acc.email)
    setPassword(DEMO_PASSWORD)
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="brand big">
          <span className="brand-logo">GM</span>
          <span className="brand-text">GymMaster</span>
        </div>
        <h2>Hệ thống quản lý trung tâm thể hình</h2>
        <p>Quản lý gói tập, lớp học, lịch huấn luyện và hội viên trên một nền tảng.</p>
      </div>

      <div className="auth-card">
        <h3>Đăng nhập</h3>
        <form onSubmit={submit} className="form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ban@email.com" />
          </label>
          <label>
            Mật khẩu
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Nhập mật khẩu" />
          </label>
          {notice && !error && <div className="alert alert-info">{notice}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary full" type="submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="center small">
          Chưa có tài khoản?{' '}
          <button className="link" onClick={onRegister}>
            Đăng ký hội viên
          </button>
        </p>

        <div className="demo-box">
          <div className="small muted">Tài khoản mẫu (mật khẩu {DEMO_PASSWORD}), bấm để điền nhanh:</div>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.email} type="button" className="demo-chip" onClick={() => fillDemo(acc)}>
                <strong>{ROLE_LABELS[acc.role]}</strong>
                <span>{acc.email}</span>
              </button>
            ))}
          </div>
          <button type="button" className="link small" onClick={resetMock}>
            Xóa dữ liệu tạm (gói đã mua, hóa đơn) để demo lại
          </button>
        </div>
      </div>
    </div>
  )
}
