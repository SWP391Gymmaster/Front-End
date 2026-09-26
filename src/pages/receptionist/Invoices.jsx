import { usePreferences } from '../../preferences/context'
import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { useStore } from '../../store/context'
import { formatDate, formatMoney } from '../../store/utils'

export default function Invoices() {
  const { t } = usePreferences()
  const { payments, users, packages } = useStore()
  const [viewing, setViewing] = useState(null)
  const list = [...payments].reverse()

  return (
    <div className="card">
      <div className="table-scroll"><table className="table">
        <thead><tr><th>{t("Số HĐ")}</th><th>{t("Hội viên")}</th><th>{t("Gói")}</th><th>{t("Hình thức")}</th><th>{t("Kênh")}</th><th>{t("Ngày")}</th><th className="right">{t("Số tiền")}</th><th></th></tr></thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.invoiceNo}</td>
              <td>{users.find((u) => u.id === p.userId)?.name}</td>
              <td>{packages.find((x) => x.id === p.packageId)?.name}</td>
              <td>{t(p.method)}</td>
              <td>{t(p.channel)}</td>
              <td>{formatDate(p.date)}</td>
              <td className="right">{formatMoney(p.amount)}</td>
              <td className="right"><button className="btn btn-sm" onClick={() => setViewing(p)}>{t("Xem")}</button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
      {viewing && (
        <Modal title={`Hóa đơn ${viewing.invoiceNo}`} onClose={() => setViewing(null)}>
          <Invoice payment={viewing} />
          <div className="form-actions">
            <button className="btn btn-primary" onClick={() => window.print()}>{t("In hóa đơn")}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
