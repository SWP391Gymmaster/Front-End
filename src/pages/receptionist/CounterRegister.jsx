import { usePreferences } from '../../preferences/context'
import { useState } from 'react'
import Invoice from '../../components/Invoice'
import { useStore } from '../../store/context'
import { addDays, formatDate, formatMoney, todayISO } from '../../store/utils'

const EMPTY = { name: '', phone: '', email: '', gender: 'Nam', goal: 'Giảm cân', packageId: '', method: 'Tiền mặt' }

export default function CounterRegister() {
  const { t } = usePreferences()
  const { packages, currentUser, registerAtCounter } = useStore()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const pkg = packages.find((p) => p.id === form.packageId)

  const submit = (e) => {
    e.preventDefault()
    if (!/^0\d{9}$/.test(form.phone)) return setError('Số điện thoại phải gồm 10 số, bắt đầu bằng 0')
    const res = registerAtCounter({ ...form, staffId: currentUser.id })
    if (!res.ok) return setError(res.message)
    setError('')
    setResult(res)
  }

  if (result) {
    return (
      <div className="card narrow">
        <div className="success-mark">✔</div>
        <h3 className="center">{t("Đăng ký hội viên thành công")}</h3>
        <p className="center muted">{t("Tài khoản đăng nhập: ")}<strong>{result.user.email}</strong>{t(" · mật khẩu mặc định ")}<strong>123456</strong>
        </p>
        <Invoice payment={result.payment} membership={result.membership} />
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => window.print()}>{t("In hóa đơn")}</button>
          <button className="btn btn-primary" onClick={() => { setResult(null); setForm(EMPTY) }}>{t("Đăng ký hội viên khác")}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="two-col wide-left">
      <div className="card">
        <div className="card-head"><h3>{t("Thông tin hội viên mới")}</h3></div>
        <form className="form" onSubmit={submit} id="counter-form">
          <label>{t("Họ và tên")}<input value={form.name} onChange={set('name')} required /></label>
          <div className="row-2">
            <label>{t("Số điện thoại")}<input value={form.phone} onChange={set('phone')} required placeholder={t("09xxxxxxxx")} /></label>
            <label>{t("Email")}<input type="email" value={form.email} onChange={set('email')} required /></label>
          </div>
          <div className="row-2">
            <label>{t("Giới tính")}<select value={form.gender} onChange={set('gender')}><option value="Nam">{t("Nam")}</option><option value="Nữ">{t("Nữ")}</option><option value="Khác">{t("Khác")}</option></select>
            </label>
            <label>{t("Mục tiêu")}<select value={form.goal} onChange={set('goal')}>
                <option value="Giảm cân">{t("Giảm cân")}</option><option value="Tăng cơ">{t("Tăng cơ")}</option><option value="Giữ dáng">{t("Giữ dáng")}</option><option value="Cải thiện sức khỏe">{t("Cải thiện sức khỏe")}</option>
              </select>
            </label>
          </div>
          <div className="field">
            <span>{t("Chọn gói tập")}</span>
            <div className="pkg-pick">
              {packages.filter((p) => p.active).map((p) => (
                <label key={p.id} className={'method' + (form.packageId === p.id ? ' on' : '')}>
                  <input type="radio" name="pkg" required checked={form.packageId === p.id} onChange={() => setForm({ ...form, packageId: p.id })} />
                  <span><strong>{p.name}</strong><br /><span className="small muted">{formatMoney(p.price)} · {p.days}{t(" ngày")}</span></span>
                </label>
              ))}
            </div>
          </div>
          <label>{t("Hình thức thanh toán")}<select value={form.method} onChange={set('method')}><option value="Tiền mặt">{t("Tiền mặt")}</option><option value="Chuyển khoản">{t("Chuyển khoản")}</option><option value="Quẹt thẻ">{t("Quẹt thẻ")}</option></select>
          </label>
          {error && <div className="alert alert-error">{t(error)}</div>}
        </form>
      </div>

      <div className="card sticky">
        <div className="card-head"><h3>{t("Tóm tắt")}</h3></div>
        {pkg ? (
          <div className="summary">
            <div><span>{t("Gói")}</span><strong>{pkg.name}</strong></div>
            <div><span>{t("Hiệu lực")}</span><strong>{formatDate(todayISO())} → {formatDate(addDays(todayISO(), pkg.days - 1))}</strong></div>
            <div><span>{t("Thanh toán")}</span><strong>{t(form.method)}</strong></div>
            <div className="total"><span>{t("Tổng tiền")}</span><strong>{formatMoney(pkg.price)}</strong></div>
          </div>
        ) : (
          <p className="muted">{t("Chọn gói tập để xem tổng tiền.")}</p>
        )}
        <button className="btn btn-primary full" type="submit" form="counter-form">{t("Xác nhận thu tiền & đăng ký")}</button>
      </div>
    </div>
  )
}
