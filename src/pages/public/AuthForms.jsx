import { useRef, useState } from 'react'
import { useStore } from '../../store/context'
import PasswordField from '../../components/PasswordField'
import { PASSWORD_HINT, publicService, validateRegistration } from '../../services/publicService'
import EmailVerificationModal from './EmailVerificationModal'

export function LoginForm() {
  const { login, notice, authMessage } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lock = useRef(false)
  async function submit(e) {
    e.preventDefault()
    if (lock.current) return
    lock.current = true; setBusy(true); setError('')
    try { await login(email.trim(), password) }
    catch (e) { setError(e.message) }
    finally { lock.current = false; setBusy(false) }
  }
  return <section className="fe1-auth"><div className="fe1-auth-story"><span className="fe1-eyebrow">GYMMASTER / WELCOME BACK</span><h1>Trở lại với<br />mục tiêu của bạn.</h1><p>Theo dõi lịch tập, quản lý gói và giữ nhịp luyện tập mỗi ngày.</p></div>
    <div className="fe1-form-card"><h2>Đăng nhập</h2><p>Nhập email và mật khẩu của bạn.</p><form onSubmit={submit} className="fe1-form">
      <label>Email<input type="email" autoComplete="username" required value={email} disabled={busy} onChange={e => setEmail(e.target.value)} /></label>
      <PasswordField label="Mật khẩu" autoComplete="current-password" required value={password} disabled={busy} onChange={e => setPassword(e.target.value)} />
      {(error || notice || authMessage) && <p className="fe1-feedback" role="alert">{error || notice || authMessage}</p>}
      <button className="fe1-button" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
    </form><p>Chưa có tài khoản? <a href="#/register">Đăng ký tài khoản</a></p></div></section>
}

const initial = { fullName: '', userName: '', email: '', phone: '', password: '', confirm: '' }
export function RegisterForm() {
  const [form, setForm] = useState(initial)
  const [fields, setFields] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pendingEmail, setPendingEmail] = useState(null)
  const lock = useRef(false)
  const change = key => e => setForm(f => ({ ...f, [key]: e.target.value }))
  async function submit(e) {
    e.preventDefault()
    if (lock.current) return
    const errors = validateRegistration(form)
    setFields(errors); setError('')
    if (Object.keys(errors).length) { setError('Vui lòng kiểm tra các trường được đánh dấu.'); return }
    lock.current = true; setBusy(true)
    try {
      const result = await publicService.register(form)
      setPendingEmail(result); setForm(initial)
    }
    catch (e) { setError(e.message); setFields(e.fields || e.details || {}) }
    finally { lock.current = false; setBusy(false) }
  }
  const input = (key, label, props = {}) => <div className="fe1-field"><label htmlFor={`register-${key}`}>{label}</label><input id={`register-${key}`} {...props} required value={form[key]} onChange={change(key)} disabled={busy} aria-invalid={!!fields[key]} aria-describedby={fields[key] ? `error-${key}` : undefined} />{fields[key] && <small id={`error-${key}`} className="fe1-error-text">{fields[key]}</small>}</div>
  return <><section className="fe1-auth"><div className="fe1-auth-story"><span className="fe1-eyebrow">GYMMASTER / YOUR FIRST STEP</span><h1>Bắt đầu bằng<br />một tài khoản.</h1><p>Đăng ký tài khoản miễn phí. Sau khi xác minh email, bạn có thể xem danh sách lớp và chọn gói phù hợp.</p></div><div className="fe1-form-card">
    <h2>Tạo tài khoản</h2><p>Thông tin của bạn để bắt đầu cùng GymMaster.</p><form className="fe1-form" onSubmit={submit} noValidate>
      {input('fullName', 'Họ và tên', { autoComplete: 'name', maxLength: 100 })}
      {input('userName', 'Tên đăng nhập', { autoComplete: 'username', maxLength: 50 })}<small>3–50 ký tự: chữ không dấu, số, dấu _ hoặc .</small>
      <div className="fe1-two">{input('email', 'Email', { type: 'email', autoComplete: 'email' })}{input('phone', 'Số điện thoại', { type: 'tel', autoComplete: 'tel', inputMode: 'tel' })}</div>
      <PasswordField label="Mật khẩu" autoComplete="new-password" value={form.password} onChange={change('password')} required disabled={busy} hint={PASSWORD_HINT} error={fields.password} />
      <PasswordField label="Xác nhận mật khẩu" autoComplete="new-password" value={form.confirm} onChange={change('confirm')} required disabled={busy} error={fields.confirm} />
      {error && <p className="fe1-feedback" role="alert">{error}</p>}<button className="fe1-button" disabled={busy}>{busy ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</button>
    </form><p>Đã có tài khoản? <a href="#/login">Đăng nhập</a></p>
  </div></section>{pendingEmail && <EmailVerificationModal email={pendingEmail.email} deliveryStatus={pendingEmail.verificationEmailStatus} onClose={() => setPendingEmail(null)} />}</>
}
