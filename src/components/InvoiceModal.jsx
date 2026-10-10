import { useEffect, useState } from 'react'
import Invoice from './Invoice'
import Modal from './Modal'
import { ErrorBox, Loading } from './Status'
import { printSection } from '../store/utils'

export default function InvoiceModal({ invoiceId, payment, loadInvoice, onClose }) {
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    loadInvoice(invoiceId)
      .then((inv) => !cancelled && setInvoice(inv))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [invoiceId, loadInvoice])

  return (
    <Modal title={invoice ? `Hóa đơn ${invoice.invoiceCode}` : 'Hóa đơn'} onClose={onClose}>
      <ErrorBox error={error} />
      {!invoice && !error && <Loading />}
      {invoice && (
        <div className="stack">
          <Invoice invoice={invoice} payment={payment} />
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
            <button className="btn btn-primary" onClick={() => printSection('invoice')}>In hóa đơn</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
