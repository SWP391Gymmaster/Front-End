import { usePreferences } from '../preferences/context'
import { useState } from 'react'
import { ROLES } from '../data/seed'
import { useStore } from '../store/context'
import AuthHero from '../components/AuthHero'
import PreferencesControls from '../components/PreferencesControls'
import Icon from '../components/Icon'

const DEMO_ACCOUNTS = [
  { email: 'manager@gym.vn', role: 'manager' },
  { email: 'letan@gym.vn', role: 'receptionist' },
  { email: 'coach@gym.vn', role: 'coach' },
  { email: 'member@gym.vn', role: 'member' },
]

export default function Login({ onRegister }) {
  const { t } = usePreferences()
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
      <AuthHero />
      <section className="auth-panel">
      <div className="auth-top"><span className="workspace-label">{t("Không gian làm việc của bạn")}</span><PreferencesControls /></div>
      <div className="auth-card">
        <div className="auth-welcome-icon"><Icon name="dumbbell" size={26} /></div>
        <div className="eyebrow muted">{t("CHÀO MỪNG ĐẾN VỚI GYMMASTER")}</div>
        <h3>{t("Chào mừng trở lại")}</h3>
        <p className="auth-description">{t("Đăng nhập để bắt đầu một ngày hiệu quả.")}</p>
        <form onSubmit={submit} className="form">
          <label>{t("Email")}<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={t("ban@email.com")} />
          </label>
          <label>{t("Mật khẩu")}<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={t("Nhập mật khẩu")} />
          </label>
          {error && <div className="alert alert-error">{t(error)}</div>}
          <button className="btn btn-primary full" type="submit">{t("Đăng nhập ")}<Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="center small">{t("Chưa có tài khoản?")}{' '}
          <button className="link" onClick={onRegister}>{t("Đăng ký hội viên")}</button>
        </p>

        <div className="demo-box">
          <div className="demo-heading"><strong>{t("Khám phá bản demo")}</strong><span className="badge badge-green">{t("4 vai trò")}</span></div>
          <div className="small muted">{t("Chọn vai trò để điền nhanh · Mật khẩu: 123456")}</div>
          <div className="demo-grid">
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.email} type="button" className="demo-chip" onClick={() => fillDemo(acc)}>
                <Icon name={acc.role === 'manager' ? 'grid' : acc.role === 'coach' ? 'dumbbell' : 'user'} size={19} />
                <div><strong>{t(ROLES[acc.role])}</strong><span>{acc.email}</span></div>
              </button>
            ))}
          </div>
          <button type="button" className="link small" onClick={resetDemo}>{t("Khôi phục dữ liệu demo ban đầu")}</button>
        </div>
      </div>
      <div className="auth-bottom"><Icon name="shield" size={15} />{t(" Không gian quản lý dành cho đội ngũ của bạn")}</div>
      </section>
    </div>
  )
}
