import { useState } from 'react'
import Invoice from '../../components/Invoice'
import { ErrorBox, Loading } from '../../components/Status'
import { authApi, invoiceApi, packageApi, paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { addDays, formatDate, formatMoney, printSection, todayISO } from '../../store/utils'

// Mật khẩu mặc định cho hội viên đăng ký tại quầy (Back-End yêu cầu tối thiểu 8 ký tự)
const DEFAULT_PASSWORD = '12345678'
const EMPTY = { fullName: '', userName: '', phone: '', email: '', packageId: '', note: '' }
const toUserName = (email) => email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '')

// Luồng: (1) POST /auth/register  ->  (2) POST /api/payments/cash-checkout  ->  (3) hóa đơn
export default function CounterRegister() {
  const { data: packages, loading, error: loadError, reload } = useApi(() => packageApi.list())
  const [form, setForm] = useState(EMPTY)
  const [userNameTouched, setUserNameTouched] = useState(false)
  const [member, setMember] = useState(null) // tài khoản đã tạo ở bước 1
  const [result, setResult] = useState(null) // { payment, invoice } sau bước 2
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const active = (packages || []).filter((p) => p.active !== false)
  const pkg = active.find((p) => String(p.id) === form.packageId)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setEmail = (e) => {
    const email = e.target.value
    setForm({ ...form, email, userName: userNameTouched ? form.userName : toUserName(email) })
  }

  // Bước 2: thu tiền mặt cho tài khoản đã có
  const checkout = async (memberId) => {
    const payment = await paymentApi.cashCheckout({ memberId, packageId: pkg.id, note: form.note || undefined })
    const invoice = await invoiceApi.get(payment.invoiceId)
    setResult({ payment, invoice })
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!member) {
      if (!/^0\d{9}$/.test(form.phone)) return setError('Số điện thoại phải gồm 10 số, bắt đầu bằng 0')
      if (!/^[a-zA-Z0-9_.]{3,}$/.test(form.userName)) {
        return setError('Tên đăng nhập tối thiểu 3 ký tự, chỉ gồm chữ không dấu, số, dấu _ hoặc .')
      }
    }
    if (!pkg) return setError('Vui lòng chọn gói tập')
    setError('')
    setSaving(true)
    let created = member
    try {
      // Bước 1: tạo tài khoản (bỏ qua nếu đã tạo ở lần thử trước). Phiên đăng nhập của lễ tân giữ nguyên.
      if (!created) {
        const res = await authApi.register({
          userName: form.userName,
          fullName: form.fullName,
          email: form.email.trim(),
          phone: form.phone,
          password: DEFAULT_PASSWORD,
        })
        created = { userId: res.userId, email: res.email, fullName: res.fullName }
        setMember(created)
      }
      await checkout(created.userId)
    } catch (err) {
      setError(
        created
          ? `Đã tạo tài khoản nhưng chưa thu được tiền: ${err.message}. Bấm "Thu tiền" để thử lại.`
          : err.message,
      )
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setForm(EMPTY)
    setUserNameTouched(false)
    setMember(null)
    setResult(null)
    setError('')
  }

  if (result) {
    return (
      <div className="card narrow">
        <div className="success-mark">✔</div>
        <h3 className="center">Đăng ký hội viên thành công</h3>
        <p className="center muted">
          Tài khoản: <strong>{member.email}</strong> · mật khẩu mặc định <strong>{DEFAULT_PASSWORD}</strong>
          <br />
          Gói tập đã được kích hoạt, tiền đã ghi nhận vào doanh thu.
        </p>
        <Invoice invoice={result.invoice} payment={result.payment} />
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => printSection('invoice')}>In hóa đơn</button>
          <button className="btn btn-primary" onClick={reset}>Đăng ký hội viên khác</button>
        </div>
      </div>
    )
  }

  return (
    <div className="two-col wide-left">
      <div className="card">
        <div className="card-head"><h3>Thông tin hội viên mới</h3></div>
        <ol className="steps">
          <li className={member ? 'done' : 'on'}>Tạo tài khoản</li>
          <li className={member ? 'on' : ''}>Thu tiền</li>
          <li>In hóa đơn</li>
        </ol>
        {member && (
          <div className="alert alert-info">
            Đã tạo tài khoản <strong>{member.email}</strong> (mã #{member.userId}). Chỉ còn bước thu tiền.{' '}
            <button className="link" onClick={reset}>Hủy, nhập hội viên khác</button>
          </div>
        )}
        <form className="form" onSubmit={submit} id="counter-form">
          <fieldset disabled={!!member} className="plain">
            <label>Họ và tên<input value={form.fullName} onChange={set('fullName')} required /></label>
            <div className="row-2">
              <label>Email<input type="email" value={form.email} onChange={setEmail} required /></label>
              <label>Số điện thoại<input value={form.phone} onChange={set('phone')} required placeholder="09xxxxxxxx" /></label>
            </div>
            <label>
              Tên đăng nhập
              <input value={form.userName} onChange={(e) => { setUserNameTouched(true); set('userName')(e) }} required />
            </label>
          </fieldset>
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
          <div className="row-2">
            <label>
              Hình thức thanh toán
              <select disabled value="CASH"><option value="CASH">Tiền mặt</option></select>
              <span className="small muted">Chuyển khoản / quẹt thẻ tại quầy: chờ Back-End (G2)</span>
            </label>
            <label>Ghi chú (không bắt buộc)<input value={form.note} onChange={set('note')} /></label>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
        </form>
      </div>

      <div className="card sticky">
        <div className="card-head"><h3>Tóm tắt</h3></div>
        {pkg ? (
          <div className="summary">
            <div><span>Gói</span><strong>{pkg.name}</strong></div>
            <div><span>Hiệu lực dự kiến</span><strong>{formatDate(todayISO())} → {formatDate(addDays(todayISO(), pkg.durationDays - 1))}</strong></div>
            <div><span>Thanh toán</span><strong>Tiền mặt</strong></div>
            <div className="total"><span>Tổng tiền</span><strong>{formatMoney(pkg.price)}</strong></div>
          </div>
        ) : (
          <p className="muted">Chọn gói tập để xem tổng tiền.</p>
        )}
        <button className="btn btn-primary full" type="submit" form="counter-form" disabled={saving}>
          {saving ? 'Đang xử lý...' : member ? 'Thu tiền' : 'Xác nhận thu tiền & đăng ký'}
        </button>
      </div>
    </div>
  )
}
