import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus } from '../../store/utils'

export default function MemberHome({ goTo }) {
  const { currentUser, memberships, packages, payments } = useStore()
  const status = getMembershipStatus(currentUser.id, memberships)
  const pkg = status.membership && packages.find((p) => p.id === status.membership.packageId)
  const myPayments = payments.filter((p) => p.userId === currentUser.id).reverse()

  return (
    <div className="stack">
      <div className={'membership-card status-' + status.status}>
        <div>
          <div className="muted small">Thẻ hội viên</div>
          <h2>{currentUser.name}</h2>
          <div className="small">{currentUser.phone} · Mục tiêu: {currentUser.goal || '—'}</div>
        </div>
        <div className="right">
          <span className="badge">{status.label}</span>
          {pkg && <div className="mc-pkg">{pkg.name}</div>}
          {status.status === 'active' && (
            <div className="small">Hết hạn {formatDate(status.membership.endDate)} · còn {status.daysLeft} ngày</div>
          )}
        </div>
      </div>

      {status.status !== 'active' && (
        <div className="alert alert-info">
          Bạn chưa có gói tập đang hoạt động.{' '}
          <button className="link" onClick={() => goTo('buy')}>Chọn gói ngay →</button>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>Lịch sử thanh toán</h3></div>
        {myPayments.length === 0 ? (
          <p className="muted">Chưa có giao dịch.</p>
        ) : (
          <table className="table">
            <thead><tr><th>Số HĐ</th><th>Gói</th><th>Hình thức</th><th>Ngày</th><th className="right">Số tiền</th></tr></thead>
            <tbody>
              {myPayments.map((p) => (
                <tr key={p.id}>
                  <td>{p.invoiceNo}</td>
                  <td>{packages.find((x) => x.id === p.packageId)?.name}</td>
                  <td>{p.method} ({p.channel})</td>
                  <td>{formatDate(p.date)}</td>
                  <td className="right">{formatMoney(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
