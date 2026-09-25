import { useState } from 'react'
import { ROLES } from '../data/seed'
import { useStore } from '../store/context'

const DEMO_ACCOUNTS = [
  { email: 'manager@gym.vn', role: 'manager' },
  { email: 'letan@gym.vn', role: 'receptionist' },
  { email: 'coach@gym.vn', role: 'coach' },
  { email: 'member@gym.vn', role: 'member' },
]

export default function Login({ onRegister }) {
  const { login, resetDemo } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const res = login(email, password)
    if (!res.ok) setError(res.message)
  }

  const fillDemo = (acc) => {
    setEmail(acc.email)
    setPassword('123456')
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
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-primary full" type="submit">
            Đăng nhập
          </button>
        </form>
        <p className="center small">
          Chưa có tài khoản?{' '}
          <button className="link" onClick={onRegister}>
            Đăng ký hội viên
          </button>
        </p>

        <div className="demo-box">
          <div className="small muted">Tài khoản demo (mật khẩu 123456), bấm để điền nhanh:</div>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.email} type="button" className="demo-chip" onClick={() => fillDemo(acc)}>
                <strong>{ROLES[acc.role]}</strong>
                <span>{acc.email}</span>
              </button>
            ))}
          </div>
          <button type="button" className="link small" onClick={resetDemo}>
            Khôi phục dữ liệu demo ban đầu
          </button>
        </div>
      </div>
    </div>
  )
}
