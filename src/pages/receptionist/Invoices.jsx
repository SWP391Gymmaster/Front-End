import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { MockBadge } from '../../components/Status'
import { useStore } from '../../store/context'
import { formatDate, formatMoney } from '../../store/utils'

export default function Invoices() {
  const { payments, members } = useStore()
  const [viewing, setViewing] = useState(null)
  const list = [...payments].reverse()

  return (
    <div className="card">
      <div className="card-head"><h3>Danh sách hóa đơn <MockBadge /></h3></div>
      <table className="table">
        <thead><tr><th>Số HĐ</th><th>Hội viên</th><th>Gói</th><th>Hình thức</th><th>Kênh</th><th>Ngày</th><th className="right">Số tiền</th><th></th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.invoiceNo}</td>
              <td>{members.find((m) => m.email === p.email)?.fullName || p.email}</td>
              <td>{p.packageName}</td>
              <td>{p.method}</td>
              <td>{p.channel}</td>
              <td>{formatDate(p.date)}</td>
              <td className="right">{formatMoney(p.amount)}</td>
              <td className="right"><button className="btn btn-sm" onClick={() => setViewing(p)}>Xem</button></td>
            </tr>
          ))}
          {list.length === 0 && <tr><td colSpan="8" className="center muted">Chưa có hóa đơn</td></tr>}
        </tbody>
      </table>
      {viewing && (
        <Modal title={`Hóa đơn ${viewing.invoiceNo}`} onClose={() => setViewing(null)}>
          <Invoice payment={viewing} />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={() => window.print()}>In hóa đơn</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
