import { useStore } from '../store/context'
import { formatDate, formatMoney } from '../store/utils'

export default function Invoice({ payment }) {
  const { members } = useStore()
  const member = members.find((m) => m.email === payment.email)
  const invoiceNo = payment.invoiceCode || payment.invoiceNo
  const issuedAt = payment.createdAt || payment.date
  const memberName = payment.memberName || member?.fullName || payment.email || `Hội viên #${payment.memberId}`
  const paymentMethod = payment.paymentMethod || payment.method
  const channel = payment.channel
  const startDate = payment.startDate
  const endDate = payment.endDate

  return (
    <div className="invoice print-area">
      <div className="invoice-head">
        <div>
          <div className="brand-text">GymMaster</div>
          <div className="muted small">Trung tâm thể hình GymMaster</div>
        </div>
        <div className="right">
          <div className="invoice-title">HÓA ĐƠN</div>
          <div className="muted small">Số: {invoiceNo}</div>
          <div className="muted small">Ngày: {formatDate(issuedAt)}</div>
        </div>
      </div>
      <table className="table invoice-table">
        <tbody>
          <tr><td>Hội viên</td><td>{memberName}</td></tr>
          {member?.phone && <tr><td>Số điện thoại</td><td>{member.phone}</td></tr>}
          {payment.email && <tr><td>Email</td><td>{payment.email}</td></tr>}
          <tr><td>Gói tập</td><td>{payment.packageName}</td></tr>
          {startDate && endDate && <tr><td>Thời hạn</td><td>{formatDate(startDate)} → {formatDate(endDate)}</td></tr>}
          <tr><td>Hình thức</td><td>{paymentMethod}{channel ? ` (${channel})` : ''}</td></tr>
          {payment.staffName && <tr><td>Nhân viên thu</td><td>{payment.staffName}</td></tr>}
          {payment.status && <tr><td>Trạng thái</td><td>{payment.status === 'COMPLETED' ? 'Đã thanh toán' : payment.status}</td></tr>}
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
