import { usePreferences } from '../../preferences/context'
import { useState } from 'react'
import Invoice from '../../components/Invoice'
import { ErrorBox, Loading } from '../../components/Status'
import { authApi, packageApi, paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { formatMoney } from '../../store/utils'

const DEFAULT_PASSWORD = '12345678'
const EMPTY = { fullName: '', userName: '', phone: '', email: '', packageId: '' }

export default function CounterRegister() {
  const { t } = usePreferences()
  const { packages, currentUser, registerAtCounter } = useStore()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const pkg = packages.find((p) => p.id === form.packageId)

const DEFAULT_PASSWORD = '12345678'
const EMPTY = { fullName: '', userName: '', phone: '', email: '', packageId: '', note: '', method:'CASH' }
const toUserName = (email) => email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '')

export default function CounterRegister() {
  const { data: packages, loading, error: loadError, reload } = useApi(() => packageApi.list())
  const [form, setForm] = useState(EMPTY)
  const [userNameTouched, setUserNameTouched] = useState(false)
  const [member, setMember] = useState(null) 
  const [result, setResult] = useState(null) 
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [pendingMember, setPendingMember] = useState(null)

  const active = (packages || []).filter((p) => p.active !== false)
  const pkg = active.find((p) => String(p.id) === form.packageId)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const setEmail = (e) => {
    const email = e.target.value
    setForm({ ...form, email, userName: userNameTouched ? form.userName : toUserName(email) })
  }

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
    let memberCreated = Boolean(pendingMember)
    try {
      let member = pendingMember
      if (!member) {
        member = await authApi.register({
    let created = member
    try {
      if (!created) {
        const res = await authApi.register({
          userName: form.userName,
          fullName: form.fullName,
          email: form.email.trim(),
          phone: form.phone,
          password: DEFAULT_PASSWORD,
        })
        memberCreated = true
        setPendingMember(member)
        addMember({
          userId: member.userId,
          email: form.email.trim(),
          fullName: form.fullName,
          phone: form.phone,
        })
      }
      const payment = await paymentApi.cashCheckout({
        memberId: member.userId,
        packageId: pkg.id,
        note: `Thu tiền tại quầy cho gói ${pkg.name}`,
      })
      setResult(payment)
    } catch (err) {
      setError(memberCreated
        ? `Tài khoản hội viên đã được tạo nhưng chưa thu tiền thành công. ${err.message} Vui lòng thử thu tiền lại.`
        : err.message)
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
        <h3 className="center">{t("Đăng ký hội viên thành công")}</h3>
        <p className="center muted">{t("Tài khoản đăng nhập: ")}<strong>{result.user.email}</strong>{t(" · mật khẩu mặc định ")}<strong>123456</strong>
        </p>
        <Invoice payment={result} />
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
