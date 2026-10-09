import { ErrorBox, Loading } from '../../components/Status'
import { paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { formatDate, formatMoney } from '../../store/utils'

const PAYMENT_METHODS = {
  BANK_TRANSFER: 'Chuyển khoản',
  CREDIT_CARD: 'Thẻ ngân hàng',
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay',
  CASH: 'Tiền mặt',
}

export default function MemberHome({ goTo }) {
  const { session } = useStore()
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([paymentApi.myMemberships(), paymentApi.myPayments()]).then(([memberships, payments]) => ({
      memberships,
      payments,
    })),
  )
  const memberships = data?.memberships || []
  const payments = data?.payments || []
  const activeMembership = memberships.find((membership) => membership.active)
  const latestMembership = [...memberships].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  const status = activeMembership ? 'active' : latestMembership ? 'expired' : 'none'
  const statusLabel = { active: 'Đang hoạt động', expired: 'Hết hạn', none: 'Chưa có gói' }[status]
  const recentPayments = [...payments].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  return (
    <div className="stack">
      <ErrorBox error={error} onRetry={reload} />
      <div className={'membership-card status-' + status}>
        <div>
          <div className="muted small">Thẻ hội viên</div>
          <h2>{session.name}</h2>
          <div className="small">{session.email}</div>
        </div>
        <div className="right">
          <span className="badge">{statusLabel}</span>
          {latestMembership && <div className="mc-pkg">{latestMembership.packageName}</div>}
          {activeMembership && (
            <div className="small">Hết hạn {formatDate(activeMembership.endDate)} · còn {activeMembership.daysRemaining} ngày</div>
          )}
        </div>
      </div>

      {status !== 'active' && (
        <div className="alert alert-info">
          {status === 'expired' ? 'Gói tập của bạn đã hết hạn. ' : 'Bạn chưa có gói tập đang hoạt động. '}
          <button className="link" onClick={() => goTo('buy')}>Chọn/gia hạn gói ngay →</button>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Lịch sử thanh toán</h3></div>
        {loading && !data ? <Loading /> : (
          <table className="table">
            <thead><tr><th>Số HĐ</th><th>Gói</th><th>Hình thức</th><th>Trạng thái</th><th>Ngày</th><th className="right">Số tiền</th></tr></thead>
            <tbody>
              {recentPayments.map((payment) => (
                <tr key={payment.paymentId}>
                  <td>{payment.invoiceCode}</td>
                  <td>{payment.packageName}</td>
                  <td>{PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod}</td>
                  <td>{payment.status === 'COMPLETED' ? 'Đã thanh toán' : payment.status}</td>
                  <td>{formatDate(payment.completedAt || payment.createdAt)}</td>
                  <td className="right">{formatMoney(payment.amount)}</td>
                </tr>
              ))}
              {data && recentPayments.length === 0 && (
                <tr><td colSpan="6" className="center muted">Chưa có giao dịch.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
