import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { usePreferences } from '../../preferences/context'
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
  const { t } = usePreferences()
  const { users, memberships, packages, currentUser, purchase } = useStore()
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
      <input className="search" placeholder={t("🔎 Tìm theo tên, số điện thoại hoặc email...")} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card">
        <div className="table-scroll"><table className="table">
          <thead><tr><th>{t("Hội viên")}</th><th>{t("Liên hệ")}</th><th>{t("Gói hiện tại")}</th><th>{t("Hạn sử dụng")}</th><th>{t("Trạng thái")}</th><th></th></tr></thead>
          <tbody>
            {list.map((m) => {
              const recorded = getRecordedMemberships(m, payments, packages)
              const s = recorded.length
                ? getMembershipStatus(m.email, recorded)
                : getMembershipStatus(m.email, memberships)
              return (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong><div className="small muted">{t(m.goal)}</div></td>
                  <td>{m.phone}<div className="small muted">{m.email}</div></td>
                  <td>{t(s.membership ? packages.find((p) => p.id === s.membership.packageId)?.name : '—')}</td>
                  <td>{t(s.membership ? formatDate(s.membership.endDate) : '—')}{s.daysLeft ? <div className="small muted">{t("còn ")}{s.daysLeft}{t(" ngày")}</div> : null}</td>
                  <td><span className={'badge ' + badge[s.status]}>{t(s.label)}</span></td>
                  <td className="right"><button className="btn btn-sm" onClick={() => setRenewing(m)}>{t(s.status === 'none' ? 'Đăng ký gói' : 'Gia hạn')}</button></td>
                </tr>
              )
            })}
            {members.length === 0 && <tr><td colSpan="6" className="center muted">{t("Không tìm thấy hội viên")}</td></tr>}
          </tbody>
        </table></div>
      </div>

      {renewing && (
        <Modal title={result ? 'Gia hạn thành công' : `Gia hạn gói · ${renewing.name}`} onClose={() => !saving && close()}>
          {result ? (
            <div className="stack">
              <Invoice payment={result} />
              <p className="center muted">Thời hạn mới được cộng nối tiếp sau gói hiện tại (nếu còn hạn).</p>
              <Invoice invoice={result.invoice} payment={result.payment} />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => window.print()}>{t("In hóa đơn")}</button>
                <button className="btn btn-primary" onClick={close}>{t("Xong")}</button>
              </div>
            </div>
          ) : (
            <div className="form">
              <label>{t("Gói tập")}<select value={pkgId} onChange={(e) => setPkgId(e.target.value)}>
                  <option value="">{t("-- Chọn gói --")}</option>
                  {packages.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} · {formatMoney(p.price)}</option>)}
                </select>
              </label>
              <label>{t("Hình thức thanh toán")}<select value={method} onChange={(e) => setMethod(e.target.value)}><option value="Tiền mặt">{t("Tiền mặt")}</option><option value="Chuyển khoản">{t("Chuyển khoản")}</option><option value="Quẹt thẻ">{t("Quẹt thẻ")}</option></select>
              </label>
              {actionError && <div className="alert alert-error">{actionError}</div>}
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close}>{t("Hủy")}</button>
                <button className="btn btn-primary" disabled={!pkgId} onClick={confirm}>{t("Xác nhận thu tiền")}</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
