import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { ErrorBox, Loading } from '../../components/Status'
import { paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { formatDate, formatMoney } from '../../store/utils'

const PAYMENT_METHODS = {
  BANK_TRANSFER: 'Chuyển khoản',
  CREDIT_CARD: 'Thẻ ngân hàng',
  MOMO: 'Ví MoMo',
  VNPAY: 'VNPay',
  CASH: 'Tiền mặt',
}

export default function Invoices() {
  const { data: payments, loading, error, reload } = useApi(() => paymentApi.list())
  const [viewing, setViewing] = useState(null)
  const list = payments || []

  return (
    <div className="card">
      <div className="card-head"><h3>Danh sách hóa đơn</h3></div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !payments ? <Loading /> : (
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Số HĐ</th><th>Hội viên</th><th>Gói</th><th>Hình thức</th><th>Trạng thái</th><th>Ngày</th><th className="right">Số tiền</th><th></th></tr></thead>
            <tbody>
              {list.map((payment) => (
                <tr key={payment.paymentId}>
                  <td>{payment.invoiceCode}</td>
                  <td>{payment.memberName || `Hội viên #${payment.memberId}`}</td>
                  <td>{payment.packageName}</td>
                  <td>{PAYMENT_METHODS[payment.paymentMethod] || payment.paymentMethod}</td>
                  <td>{payment.status === 'COMPLETED' ? 'Đã thanh toán' : payment.status}</td>
                  <td>{formatDate(payment.completedAt || payment.createdAt)}</td>
                  <td className="right">{formatMoney(payment.amount)}</td>
                  <td className="right"><button className="btn btn-sm" onClick={() => setViewing(payment)}>Xem</button></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan="8" className="center muted">Chưa có hóa đơn</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {viewing && (
        <Modal title={`Hóa đơn ${viewing.invoiceCode}`} onClose={() => setViewing(null)}>
          <Invoice payment={viewing} />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={() => window.print()}>In hóa đơn</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
