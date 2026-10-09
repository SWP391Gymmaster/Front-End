import { useState } from 'react'
import InvoiceModal from '../../components/InvoiceModal'
import { ErrorBox, Loading } from '../../components/Status'
import { memberPaymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { formatDate, formatDateTime, formatMoney, PAYMENT_METHOD, PAYMENT_STATUS, todayISO } from '../../store/utils'

export default function MemberHome({ goTo }) {
  const { session } = useStore()
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([memberPaymentApi.memberships(), memberPaymentApi.payments()]).then(([memberships, payments]) => ({ memberships, payments })),
  )
  const [viewing, setViewing] = useState(null)
  const [paying, setPaying] = useState(null)
  const [payError, setPayError] = useState('')

  if (loading && !data) return <Loading />

  const today = todayISO()
  const memberships = data?.memberships || []
  const current = memberships.find((m) => m.active)
  const upcoming = memberships.filter((m) => m.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const lastEnd = memberships.map((m) => m.endDate).sort().pop()
  const status = current ? 'active' : lastEnd ? 'expired' : 'none'
  const label = { active: 'Đang hoạt động', expired: 'Hết hạn', none: 'Chưa có gói' }[status]
  const payments = data?.payments || []

  const payPending = async (p) => {
    setPaying(p.paymentId)
    setPayError('')
    try {
      await memberPaymentApi.simulatePay(p.paymentId)
      reload()
    } catch (err) {
      setPayError(err.message)
    } finally {
      setPaying(null)
    }
  }

  return (
    <div className="stack">
      <ErrorBox error={error} onRetry={reload} />
      <div className={'membership-card status-' + status}>
        <div>
          <div className="muted small">Thẻ hội viên</div>
          <h2>{session.name}</h2>
          <div className="small">{session.email} · Mã hội viên #{session.userId}</div>
        </div>
        <div className="right">
          <span className="badge">{label}</span>
          {current && <div className="mc-pkg">{current.packageName}</div>}
          {current && <div className="small">Hết hạn {formatDate(current.endDate)} · còn {current.daysRemaining} ngày</div>}
          {!current && lastEnd && <div className="small">Hết hạn từ {formatDate(lastEnd)}</div>}
          {upcoming.length > 0 && (
            <div className="small">Gói kế tiếp: {upcoming[0].packageName} từ {formatDate(upcoming[0].startDate)}</div>
          )}
        </div>
      </div>

      {status !== 'active' && (
        <div className="alert alert-info">
          Bạn chưa có gói tập đang hoạt động.{' '}
          <button className="link" onClick={() => goTo('buy')}>Chọn gói ngay →</button>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Lịch sử thanh toán</h3></div>
        {payError && <div className="alert alert-error">{payError}</div>}
        {payments.length === 0 ? (
          <p className="muted">Chưa có giao dịch.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Mã đơn</th><th>Gói</th><th>Hình thức</th><th>Thời điểm</th><th>Trạng thái</th><th className="right">Số tiền</th><th></th></tr></thead>
            <tbody>
              {payments.map((p) => {
                const st = PAYMENT_STATUS[p.status] || { label: p.status, badge: 'badge-gray' }
                return (
                  <tr key={p.paymentId}>
                    <td className="mono">{p.paymentCode}</td>
                    <td>{p.packageName}</td>
                    <td>{PAYMENT_METHOD[p.paymentMethod] || p.paymentMethod}</td>
                    <td>{formatDateTime(p.completedAt || p.createdAt)}</td>
                    <td><span className={'badge ' + st.badge}>{st.label}</span></td>
                    <td className="right">{formatMoney(p.amount)}</td>
                    <td className="right nowrap">
                      {p.status === 'PENDING' && (
                        <button className="btn btn-sm btn-primary" disabled={paying === p.paymentId} onClick={() => payPending(p)}>
                          {paying === p.paymentId ? 'Đang xử lý...' : 'Thanh toán'}
                        </button>
                      )}{' '}
                      <button className="btn btn-sm" onClick={() => setViewing(p)}>Hóa đơn</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <InvoiceModal invoiceId={viewing.invoiceId} payment={viewing} loadInvoice={memberPaymentApi.invoice} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
