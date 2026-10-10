import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { ErrorBox, MockBadge } from '../../components/Status'
import { packageApi, paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { addDays, formatDate, formatMoney, getMembershipStatus, toISODate } from '../../store/utils'

const getRecordedMemberships = (member, payments, packages) => {
  const completed = payments
    .filter((payment) => String(payment.memberId) === String(member.userId) && payment.status === 'COMPLETED')
    .sort((a, b) => (a.completedAt || '').localeCompare(b.completedAt || ''))

  return completed.reduce((memberships, payment) => {
    const pkg = packages.find((item) => String(item.id) === String(payment.packageId))
    if (!pkg?.durationDays || !payment.completedAt) return memberships
    const paidDate = toISODate(new Date(payment.completedAt))
    const previousEnd = memberships.at(-1)?.endDate
    const startDate = previousEnd && previousEnd >= paidDate ? addDays(previousEnd, 1) : paidDate
    memberships.push({
      email: member.email,
      packageName: payment.packageName || pkg.name,
      startDate,
      endDate: addDays(startDate, pkg.durationDays - 1),
    })
    return memberships
  }, [])
}

export default function MemberSearch() {
  const { members, memberships } = useStore()
  const { data, error, loading, reload } = useApi(() =>
    Promise.all([packageApi.list(), paymentApi.list()]).then(([packages, payments]) => ({ packages, payments })),
import { ErrorBox, Loading } from '../../components/Status'
import { invoiceApi, packageApi, paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { completedPayments, formatDateTime, formatMoney, printSection, sumAmount } from '../../store/utils'

export default function MemberSearch() {
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([paymentApi.list(), packageApi.list()]).then(([payments, packages]) => ({ payments, packages })),
  )
  const [q, setQ] = useState('')
  const [renewing, setRenewing] = useState(null)
  const [pkgId, setPkgId] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [result, setResult] = useState(null)
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)

  const packages = data?.packages || []
  const payments = data?.payments || []
  const list = members.filter((m) =>
    [m.fullName, m.phone, m.email].join(' ').toLowerCase().includes(q.toLowerCase()),
  )
  const active = (packages || []).filter((p) => p.active)
  const badge = { active: 'badge-green', expired: 'badge-red', none: 'badge-gray' }

  const confirmPay = async () => {
    const pkg = active.find((p) => String(p.id) === pkgId)
    if (!renewing.userId || !pkg) return
    setSaving(true)
    setActionError('')
    try {
      const payment = await paymentApi.cashCheckout({
        memberId: renewing.userId,
        packageId: pkg.id,
        note: `Thu tiền gia hạn tại quầy cho gói ${pkg.name}`,
      })
      setResult(payment)
  const members = new Map()
  completedPayments(data?.payments).forEach((p) => {
    const m = members.get(p.memberId) || { memberId: p.memberId, name: p.memberName, payments: [] }
    m.payments.push(p)
    members.set(p.memberId, m)
  })
  const list = [...members.values()]
    .map((m) => {
      const last = [...m.payments].sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)))[0]
      return { ...m, last, total: sumAmount(m.payments) }
    })
    .filter((m) => [m.name, '#' + m.memberId].join(' ').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => String(b.last.completedAt).localeCompare(String(a.last.completedAt)))

  const active = (data?.packages || []).filter((p) => p.active !== false)

  const confirm = async () => {
    setSaving(true)
    setActionError('')
    try {
      const payment = await paymentApi.cashCheckout({ memberId: renewing.memberId, packageId: Number(pkgId) })
      const invoice = await invoiceApi.get(payment.invoiceId)
      setResult({ payment, invoice })
      reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const close = () => { setRenewing(null); setResult(null); setPkgId(''); setActionError('') }

  return (
    <div className="stack">
      <div className="alert alert-info small"><MockBadge /> Danh sách hội viên này gồm các hồ sơ đã đăng ký/đăng nhập trên trình duyệt hiện tại.</div>
      <input className="search" placeholder="🔎 Tìm theo tên, số điện thoại hoặc email..." value={q} onChange={(e) => setQ(e.target.value)} />
      <ErrorBox error={error} onRetry={reload} />
      <div className="card">
        {loading && !data && <div className="muted loading">Đang tải trạng thái gói tập...</div>}
  const close = () => {
    setRenewing(null)
    setResult(null)
    setPkgId('')
    setActionError('')
  }

  return (
    <div className="stack">
      <div className="alert alert-info small">
        Danh sách gồm các hội viên <strong>đã từng thanh toán</strong>. Danh sách đầy đủ và trạng thái gói của từng
        hội viên sẽ có khi Back-End bổ sung API hội viên (G1). Hội viên mới chưa thanh toán: dùng "Đăng ký tại quầy".
      </div>
      <input className="search" placeholder="🔎 Tìm theo tên hoặc mã hội viên..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card">
        <ErrorBox error={error} onRetry={reload} />
        {loading && !data && <Loading />}
        <table className="table">
          <thead><tr><th>Hội viên</th><th>Gói mua gần nhất</th><th>Lần thu gần nhất</th><th>Số lần</th><th className="right">Tổng đã trả</th><th></th></tr></thead>
          <tbody>
            {list.map((m) => {
              const recorded = getRecordedMemberships(m, payments, packages)
              const s = recorded.length
                ? getMembershipStatus(m.email, recorded)
                : getMembershipStatus(m.email, memberships)
              return (
                <tr key={m.email}>
                  <td><strong>{m.fullName}</strong></td>
                  <td>{m.phone || '—'}<div className="small muted">{m.email}</div></td>
                  <td>{s.membership?.packageName || '—'}</td>
                  <td>{s.membership ? formatDate(s.membership.endDate) : '—'}{s.daysLeft ? <div className="small muted">còn {s.daysLeft} ngày</div> : null}</td>
                  <td><span className={'badge ' + badge[s.status]}>{s.label}</span></td>
                  <td className="right">
                    <button className="btn btn-sm" onClick={() => { setRenewing(m); setResult(null); setPkgId(''); setActionError('') }}>
                      {s.status === 'none' ? 'Đăng ký gói' : 'Gia hạn'}
                    </button>
                  </td>
                </tr>
              )
            })}
            {list.length === 0 && <tr><td colSpan="6" className="center muted">Không tìm thấy hội viên</td></tr>}
            {list.map((m) => (
              <tr key={m.memberId}>
                <td><strong>{m.name}</strong><div className="small muted">#{m.memberId}</div></td>
                <td>{m.last.packageName}</td>
                <td>{formatDateTime(m.last.completedAt)}</td>
                <td>{m.payments.length}</td>
                <td className="right">{formatMoney(m.total)}</td>
                <td className="right"><button className="btn btn-sm" onClick={() => setRenewing(m)}>Gia hạn</button></td>
              </tr>
            ))}
            {data && list.length === 0 && <tr><td colSpan="6" className="center muted">Không tìm thấy hội viên</td></tr>}
          </tbody>
        </table>
      </div>

      {renewing && (
        <Modal title={result ? 'Gia hạn thành công' : `Gia hạn gói · ${renewing.name}`} onClose={() => !saving && close()}>
          {result ? (
            <div className="stack">
              <Invoice payment={result} />
              <p className="center muted">Thời hạn mới được cộng nối tiếp sau gói hiện tại (nếu còn hạn).</p>
              <Invoice invoice={result.invoice} payment={result.payment} />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => printSection('invoice')}>In hóa đơn</button>
                <button className="btn btn-primary" onClick={close}>Xong</button>
              </div>
            </div>
          ) : (
            <div className="form">
              <label>
                Gói tập
                <select value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
                  <option value="">-- Chọn gói --</option>
                  {active.map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price)}</option>)}
                </select>
              </label>
              {!renewing.userId && (
                <div className="alert alert-error">Hồ sơ này chưa liên kết được với tài khoản hội viên. Hãy yêu cầu hội viên đăng nhập lại hoặc đăng ký tại quầy.</div>
              )}
              <div className="alert alert-info small">Thanh toán tại quầy bằng tiền mặt; gói được kích hoạt sau khi khoản thu được ghi nhận.</div>
              {actionError && <div className="alert alert-error">{actionError}</div>}
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close} disabled={saving}>Hủy</button>
                <button className="btn btn-primary" disabled={!pkgId || !renewing.userId || saving} onClick={confirmPay}>
                  {saving ? 'Đang ghi nhận...' : 'Xác nhận thu tiền'}
              <label>
                Hình thức thanh toán
                <select disabled value="CASH"><option value="CASH">Tiền mặt</option></select>
              </label>
              {actionError && <div className="alert alert-error">{actionError}</div>}
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close} disabled={saving}>Hủy</button>
                <button className="btn btn-primary" disabled={!pkgId || saving} onClick={confirm}>
                  {saving ? 'Đang xử lý...' : 'Xác nhận thu tiền'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
