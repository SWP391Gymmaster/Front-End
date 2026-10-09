import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { ErrorBox, Loading } from '../../components/Status'
import { memberPaymentApi, packageApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { addDays, formatDate, formatMoney, nextStartDate, PAYMENT_METHOD, printSection, todayISO } from '../../store/utils'

const METHODS = ['BANK_TRANSFER', 'MOMO', 'VNPAY', 'CREDIT_CARD']

// Luồng mua gói online:
// 1. POST /api/member/payments/checkout -> giao dịch PENDING (CHƯA tính doanh thu)
// 2. POST /api/member/payments/{id}/simulate-pay -> COMPLETED, gói được kích hoạt, doanh thu tăng
// Nếu bấm "Để sau" hoặc lỗi, giao dịch vẫn PENDING và không làm tăng doanh thu.
export default function BuyPackage({ goTo }) {
  const { session } = useStore()
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([packageApi.list(), memberPaymentApi.memberships()]).then(([packages, memberships]) => ({ packages, memberships })),
  )
  const [selected, setSelected] = useState(null)
  const [method, setMethod] = useState(METHODS[0])
  const [step, setStep] = useState('confirm') 
  const [payment, setPayment] = useState(null)
  const [invoice, setInvoice] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  const active = (data?.packages || []).filter((p) => p.active !== false)
  const startDate = nextStartDate(data?.memberships)
  const hasActive = startDate > todayISO()

  const open = (p) => {
    setSelected(p)
    setStep('confirm')
    setPayment(null)
    setInvoice(null)
    setActionError('')
  }

  const createOrder = async () => {
    setBusy(true)
    setActionError('')
    try {
      setPayment(await memberPaymentApi.checkout({ packageId: selected.id, paymentMethod: method }))
      setStep('pay')
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const pay = async () => {
    setBusy(true)
    setActionError('')
    try {
      const done = await memberPaymentApi.simulatePay(payment.paymentId)
      setPayment(done)
      setInvoice(await memberPaymentApi.invoice(done.invoiceId))
      setStep('done')
      reload()
    } catch (err) {
      setActionError(`Thanh toán chưa thành công: ${err.message}. Đơn vẫn đang chờ, bạn có thể thử lại.`)
    } finally {
      setBusy(false)
    }
  }

  const close = () => {
    if (busy) return
    setSelected(null)
    if (step === 'pay') reload()
  }

  return (
    <div className="stack">
      {data && !hasActive && (
        <div className="alert alert-info">
          👋 Chào <strong>{session.name}</strong>! Bạn chưa có gói tập đang hoạt động. Hãy chọn một gói để bắt đầu.
        </div>
      )}
      {hasActive && (
        <div className="alert alert-info">
          Gói hiện tại còn hạn đến <strong>{formatDate(addDays(startDate, -1))}</strong>. Mua thêm sẽ được cộng nối tiếp (gia hạn).
        </div>
      )}

      <ErrorBox error={error} onRetry={reload} />
      {loading && !data && <Loading />}
      {data && active.length === 0 && <p className="muted">Trung tâm chưa mở bán gói nào.</p>}

      <div className="grid-cards">
        {active.map((p, i) => (
          <div key={p.id} className={'pkg-card' + (i === 1 ? ' featured' : '')}>
            {i === 1 && <div className="ribbon">Phổ biến</div>}
            <h3>{p.name}</h3>
            <div className="pkg-price">{formatMoney(p.price)}</div>
            <div className="muted small">{p.durationDays} ngày · ~{formatMoney(Math.round(p.price / p.durationDays))}/ngày</div>
            <p>{p.description}</p>
            <button className="btn btn-primary full" onClick={() => open(p)}>
              {hasActive ? 'Gia hạn gói này' : 'Chọn gói này'}
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <Modal
          title={step === 'done' ? 'Thanh toán thành công' : step === 'pay' ? 'Thanh toán đơn hàng' : 'Xác nhận mua gói'}
          onClose={close}
        >
          {step === 'confirm' && (
            <div className="form">
              <div className="summary">
                <div><span>Gói tập</span><strong>{selected.name}</strong></div>
                <div><span>Hiệu lực</span><strong>{formatDate(startDate)} → {formatDate(addDays(startDate, selected.durationDays - 1))}</strong></div>
                <div className="total"><span>Tổng tiền</span><strong>{formatMoney(selected.price)}</strong></div>
              </div>
              <div className="field">
                <span>Phương thức thanh toán</span>
                <div className="methods">
                  {METHODS.map((m) => (
                    <label key={m} className={'method' + (method === m ? ' on' : '')}>
                      <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
                      {PAYMENT_METHOD[m]}
                    </label>
                  ))}
                </div>
              </div>
              {actionError && <div className="alert alert-error">{actionError}</div>}
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close} disabled={busy}>Hủy</button>
                <button className="btn btn-primary" onClick={createOrder} disabled={busy}>
                  {busy ? 'Đang tạo đơn...' : 'Tiếp tục thanh toán'}
                </button>
              </div>
            </div>
          )}

          {step === 'pay' && payment && (
            <div className="form">
              <div className="summary">
                <div><span>Mã đơn</span><strong className="mono">{payment.paymentCode}</strong></div>
                <div><span>Hình thức</span><strong>{PAYMENT_METHOD[payment.paymentMethod]}</strong></div>
                <div className="total"><span>Cần thanh toán</span><strong>{formatMoney(payment.amount)}</strong></div>
              </div>
              <div className="qr-box">
                <div className="qr" aria-hidden="true" />
                <div className="small muted">
                  Quét mã để thanh toán (mô phỏng)
                  <br />Nội dung: <span className="mono">{payment.paymentCode}</span>
                </div>
              </div>
              <p className="small muted">
                Đơn đang ở trạng thái <strong>chờ thanh toán</strong> và chưa được tính vào doanh thu. Nếu bấm "Để sau",
                bạn có thể thanh toán tiếp ở "Trang của tôi", hoặc lễ tân xác nhận khi nhận được tiền.
              </p>
              {actionError && <div className="alert alert-error">{actionError}</div>}
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={close} disabled={busy}>Để sau</button>
                <button className="btn btn-primary" onClick={pay} disabled={busy}>
                  {busy ? 'Đang xử lý...' : 'Tôi đã thanh toán'}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && invoice && (
            <div className="stack">
              <div className="success-mark">✔</div>
              <p className="center">Gói <strong>{selected.name}</strong> đã được kích hoạt.</p>
              <Invoice invoice={invoice} payment={payment} />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => printSection('invoice')}>In hóa đơn</button>
                <button className="btn btn-primary" onClick={() => goTo('home')}>Về trang của tôi</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
