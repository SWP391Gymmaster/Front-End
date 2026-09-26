import { useState } from 'react'
import Invoice from '../../components/Invoice'
import { ErrorBox, Loading, MockBadge } from '../../components/Status'
import { authApi, packageApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { addDays, formatDate, formatMoney, todayISO } from '../../store/utils'

const DEFAULT_PASSWORD = '12345678'
const EMPTY = { fullName: '', userName: '', phone: '', email: '', packageId: '', method: 'Tiền mặt' }

export default function CounterRegister() {
  const { session, addMember, purchase } = useStore()
  const { data: packages, loading, error: loadError, reload } = useApi(() => packageApi.list())
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const [userNameTouched, setUserNameTouched] = useState(false)
  const setEmail = (e) => {
    const email = e.target.value
    const suggested = email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '')
    setForm({ ...form, email, userName: userNameTouched ? form.userName : suggested })
  }

  const active = (packages || []).filter((p) => p.active)
  const pkg = active.find((p) => String(p.id) === form.packageId)

  const submit = async (e) => {
    e.preventDefault()
    if (!/^0\d{9}$/.test(form.phone)) return setError('Số điện thoại phải gồm 10 số, bắt đầu bằng 0')
    if (!pkg) return setError('Vui lòng chọn gói tập')
    setError('')
    setSaving(true)
    try {
      await authApi.register({
        userName: form.userName,
        fullName: form.fullName,
        email: form.email.trim(),
        phone: form.phone,
        password: DEFAULT_PASSWORD,
      })
      addMember({ email: form.email.trim(), fullName: form.fullName, phone: form.phone })
      const res = purchase({ email: form.email.trim(), pkg, method: form.method, channel: 'Tại quầy', staffName: session.name })
      setResult({ ...res, email: form.email.trim() })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (result) {
    return (
      <div className="card narrow">
        <div className="success-mark">✔</div>
        <h3 className="center">Đăng ký hội viên thành công</h3>
        <p className="center muted">
          Tài khoản đăng nhập: <strong>{result.email}</strong> · mật khẩu mặc định <strong>{DEFAULT_PASSWORD}</strong>
        </p>
        <Invoice payment={result.payment} />
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => window.print()}>In hóa đơn</button>
          <button className="btn btn-primary" onClick={() => { setResult(null); setForm(EMPTY); setUserNameTouched(false) }}>Đăng ký hội viên khác</button>
        </div>
      </div>
    )
  }

  return (
    <div className="two-col wide-left">
      <div className="card">
        <div className="card-head"><h3>Thông tin hội viên mới</h3></div>
        <form className="form" onSubmit={submit} id="counter-form">
          <label>Họ và tên<input value={form.fullName} onChange={set('fullName')} required /></label>
          <div className="row-2">
            <label>Email<input type="email" value={form.email} onChange={setEmail} required /></label>
            <label>Số điện thoại<input value={form.phone} onChange={set('phone')} required placeholder="09xxxxxxxx" /></label>
          </div>
          <label>
            Tên đăng nhập
            <input value={form.userName} onChange={(e) => { setUserNameTouched(true); set('userName')(e) }} required />
          </label>
          <div className="field">
            <span>Chọn gói tập</span>
            <ErrorBox error={loadError} onRetry={reload} />
            {loading && !packages && <Loading />}
            <div className="pkg-pick">
              {active.map((p) => (
                <label key={p.id} className={'method' + (form.packageId === String(p.id) ? ' on' : '')}>
                  <input type="radio" name="pkg" checked={form.packageId === String(p.id)} onChange={() => setForm({ ...form, packageId: String(p.id) })} />
                  <span><strong>{p.name}</strong><br /><span className="small muted">{formatMoney(p.price)} · {p.durationDays} ngày</span></span>
                </label>
              ))}
            </div>
          </div>
          <label>
            Hình thức thanh toán
            <select value={form.method} onChange={set('method')}><option>Tiền mặt</option><option>Chuyển khoản</option><option>Quẹt thẻ</option></select>
          </label>
          {error && <div className="alert alert-error">{error}</div>}
        </form>
      </div>

      <div className="card sticky">
        <div className="card-head"><h3>Tóm tắt <MockBadge /></h3></div>
        {pkg ? (
          <div className="summary">
            <div><span>Gói</span><strong>{pkg.name}</strong></div>
            <div><span>Hiệu lực</span><strong>{formatDate(todayISO())} → {formatDate(addDays(todayISO(), pkg.durationDays - 1))}</strong></div>
            <div><span>Thanh toán</span><strong>{form.method}</strong></div>
            <div className="total"><span>Tổng tiền</span><strong>{formatMoney(pkg.price)}</strong></div>
          </div>
        ) : (
          <p className="muted">Chọn gói tập để xem tổng tiền.</p>
        )}
        <p className="small muted">Tài khoản hội viên được tạo thật trên hệ thống. Phần thanh toán đang lưu tạm.</p>
        <button className="btn btn-primary full" type="submit" form="counter-form" disabled={saving}>
          {saving ? 'Đang xử lý...' : 'Xác nhận thu tiền & đăng ký'}
        </button>
      </div>
    </div>
  )
}
