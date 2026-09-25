import { useStore } from '../store/context'
import { formatDate, formatMoney } from '../store/utils'

export default function Invoice({ payment, membership }) {
  const { users, packages } = useStore()
  const member = users.find((u) => u.id === payment.userId)
  const staff = users.find((u) => u.id === payment.staffId)
  const pkg = packages.find((p) => p.id === payment.packageId)

  return (
    <div className="invoice print-area">
      <div className="invoice-head">
        <div>
          <div className="brand-text">GymMaster</div>
          <div className="muted small">Trung tâm thể hình GymMaster</div>
        </div>
        <div className="right">
          <div className="invoice-title">HÓA ĐƠN</div>
          <div className="muted small">Số: {payment.invoiceNo}</div>
          <div className="muted small">Ngày: {formatDate(payment.date)}</div>
        </div>
      </div>
      <table className="table invoice-table">
        <tbody>
          <tr><td>Hội viên</td><td>{member?.name}</td></tr>
          <tr><td>Số điện thoại</td><td>{member?.phone}</td></tr>
          <tr><td>Gói tập</td><td>{pkg?.name}</td></tr>
          {membership && (
            <tr>
              <td>Thời hạn</td>
              <td>{formatDate(membership.startDate)} → {formatDate(membership.endDate)}</td>
            </tr>
          )}
          <tr><td>Hình thức</td><td>{payment.method} ({payment.channel})</td></tr>
          {staff && <tr><td>Nhân viên thu</td><td>{staff.name}</td></tr>}
        </tbody>
      </table>
      <div className="invoice-total">
        <span>Tổng thanh toán</span>
        <strong>{formatMoney(payment.amount)}</strong>
      </div>
      <p className="muted small center">Cảm ơn quý khách đã tin tưởng GymMaster!</p>
    </div>
  )
}
