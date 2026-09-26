import { useStore } from '../store/context'
import { formatDate, formatMoney } from '../store/utils'

export default function Invoice({ payment }) {
  const { members } = useStore()
  const member = members.find((m) => m.email === payment.email)

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
          <tr><td>Hội viên</td><td>{member?.fullName || payment.email}</td></tr>
          {member?.phone && <tr><td>Số điện thoại</td><td>{member.phone}</td></tr>}
          <tr><td>Email</td><td>{payment.email}</td></tr>
          <tr><td>Gói tập</td><td>{payment.packageName}</td></tr>
          <tr><td>Thời hạn</td><td>{formatDate(payment.startDate)} → {formatDate(payment.endDate)}</td></tr>
          <tr><td>Hình thức</td><td>{payment.method} ({payment.channel})</td></tr>
          {payment.staffName && <tr><td>Nhân viên thu</td><td>{payment.staffName}</td></tr>}
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
