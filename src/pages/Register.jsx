import { usePreferences } from '../preferences/context'
import { useState } from 'react'
import { useStore } from '../store/context'
import AuthHero from '../components/AuthHero'
import PreferencesControls from '../components/PreferencesControls'

export default function Register({ onLogin }) {
  const { t } = usePreferences()
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
    const data = { ...form }
    delete data.confirm
    const res = register(data)
    if (!res.ok) setError(res.message)
  }

  return (
    <div className="auth-page">
      <AuthHero register />
      <section className="auth-panel">
      <div className="auth-top"><span className="workspace-label">{t("Bắt đầu hành trình của bạn")}</span><PreferencesControls /></div>
      <div className="auth-card">
        <div className="eyebrow muted">{t("CÙNG BẠN TIẾN XA HƠN")}</div>
        <h3>{t("Đăng ký tài khoản")}</h3>
        <p className="auth-description">{t("Một bước gần hơn đến phiên bản tốt hơn của bạn.")}</p>
        <form onSubmit={submit} className="form">
          <label>{t("Họ và tên")}<input value={form.name} onChange={set('name')} required placeholder={t("Nguyễn Văn A")} />
          </label>
          <div className="row-2">
            <label>{t("Email")}<input type="email" value={form.email} onChange={set('email')} required />
            </label>
            <label>{t("Số điện thoại")}<input value={form.phone} onChange={set('phone')} required placeholder={t("09xxxxxxxx")} />
            </label>
          </div>
          <div className="row-2">
            <label>{t("Giới tính")}<select value={form.gender} onChange={set('gender')}>
                <option value="Nam">{t("Nam")}</option>
                <option value="Nữ">{t("Nữ")}</option>
                <option value="Khác">{t("Khác")}</option>
              </select>
            </label>
            <label>{t("Mục tiêu tập luyện")}<select value={form.goal} onChange={set('goal')}>
                <option value="Giảm cân">{t("Giảm cân")}</option>
                <option value="Tăng cơ">{t("Tăng cơ")}</option>
                <option value="Giữ dáng">{t("Giữ dáng")}</option>
                <option value="Cải thiện sức khỏe">{t("Cải thiện sức khỏe")}</option>
              </select>
            </label>
          </div>
          <div className="row-2">
            <label>{t("Mật khẩu")}<input type="password" value={form.password} onChange={set('password')} required />
            </label>
            <label>{t("Xác nhận mật khẩu")}<input type="password" value={form.confirm} onChange={set('confirm')} required />
            </label>
          </div>
          {error && <div className="alert alert-error">{t(error)}</div>}
          <button className="btn btn-primary full" type="submit">{t("Tạo tài khoản")}</button>
        </form>
        <p className="center small">{t("Đã có tài khoản?")}{' '}
          <button className="link" onClick={onLogin}>{t("Đăng nhập")}</button>
        </p>
      </div>
      </section>
    </div>
  )
}
