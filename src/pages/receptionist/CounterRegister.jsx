import { useState } from 'react'
import Invoice from '../../components/Invoice'
import { useStore } from '../../store/context'
import { addDays, formatDate, formatMoney, todayISO } from '../../store/utils'

const EMPTY = { name: '', phone: '', email: '', gender: 'Nam', goal: 'Giảm cân', packageId: '', method: 'Tiền mặt' }

export default function CounterRegister() {
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
        <h3 className="center">Đăng ký hội viên thành công</h3>
        <p className="center muted">
          Tài khoản đăng nhập: <strong>{result.user.email}</strong> · mật khẩu mặc định <strong>123456</strong>
        </p>
        <Invoice payment={result.payment} membership={result.membership} />
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => window.print()}>In hóa đơn</button>
          <button className="btn btn-primary" onClick={() => { setResult(null); setForm(EMPTY) }}>Đăng ký hội viên khác</button>
        </div>
      </div>
    )
  }

  return (
    <div className="two-col wide-left">
      <div className="card">
        <div className="card-head"><h3>Thông tin hội viên mới</h3></div>
        <form className="form" onSubmit={submit} id="counter-form">
          <label>Họ và tên<input value={form.name} onChange={set('name')} required /></label>
          <div className="row-2">
            <label>Số điện thoại<input value={form.phone} onChange={set('phone')} required placeholder="09xxxxxxxx" /></label>
            <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
          </div>
          <div className="row-2">
            <label>
              Giới tính
              <select value={form.gender} onChange={set('gender')}><option>Nam</option><option>Nữ</option><option>Khác</option></select>
            </label>
            <label>
              Mục tiêu
              <select value={form.goal} onChange={set('goal')}>
                <option>Giảm cân</option><option>Tăng cơ</option><option>Giữ dáng</option><option>Cải thiện sức khỏe</option>
              </select>
            </label>
          </div>
          <div className="field">
            <span>Chọn gói tập</span>
            <div className="pkg-pick">
              {packages.filter((p) => p.active).map((p) => (
                <label key={p.id} className={'method' + (form.packageId === p.id ? ' on' : '')}>
                  <input type="radio" name="pkg" required checked={form.packageId === p.id} onChange={() => setForm({ ...form, packageId: p.id })} />
                  <span><strong>{p.name}</strong><br /><span className="small muted">{formatMoney(p.price)} · {p.days} ngày</span></span>
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
        <div className="card-head"><h3>Tóm tắt</h3></div>
        {pkg ? (
          <div className="summary">
            <div><span>Gói</span><strong>{pkg.name}</strong></div>
            <div><span>Hiệu lực</span><strong>{formatDate(todayISO())} → {formatDate(addDays(todayISO(), pkg.days - 1))}</strong></div>
            <div><span>Thanh toán</span><strong>{form.method}</strong></div>
            <div className="total"><span>Tổng tiền</span><strong>{formatMoney(pkg.price)}</strong></div>
          </div>
        ) : (
          <p className="muted">Chọn gói tập để xem tổng tiền.</p>
        )}
        <button className="btn btn-primary full" type="submit" form="counter-form">
          Xác nhận thu tiền & đăng ký
        </button>
      </div>
    </div>
  )
}
