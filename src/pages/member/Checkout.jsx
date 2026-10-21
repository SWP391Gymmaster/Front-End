import { useRef, useState } from 'react'
import { useStore } from '../../store/context'
import { usePreferences } from '../../preferences/context'
import Modal from '../../components/Modal'
import Icon from '../../components/Icon'
import { formatMoney } from '../../store/utils'

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
  { value: 'VNPAY', label: 'VNPay', icon: '💳' },
  { value: 'MOMO', label: 'Ví MoMo', icon: '📱' },
  { value: 'CREDIT_CARD', label: 'Thẻ tín dụng / ghi nợ', icon: '💎' },
]

/**
 * T3.4: Trang Checkout đầy đủ
 * - Chọn gói → chọn phương thức → xác nhận → kết quả
 * - Trang kết quả: thành công / thất bại / huỷ
 * - Chuyển đến lịch sử giao dịch
 */
export default function Checkout({ goTo }) {
  const { packages, paymentService } = useStore()
  const { t } = usePreferences()

  const [step, setStep] = useState('select') // select | method | confirm | result
  const [selected, setSelected] = useState(null)
  const [method, setMethod] = useState('BANK_TRANSFER')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { status: 'success' | 'failed' | 'cancelled' }
  const lock = useRef(false)

  const activePackages = packages.filter((p) => p.active)

  const handleSelectPackage = (pkg) => {
    setSelected(pkg)
    setError('')
    setNote('')
    setStep('method')
  }

  const handleConfirm = () => {
    setStep('confirm')
    setError('')
  }

  const handleCheckout = async () => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')

    try {
      const response = await paymentService.checkout({
        packageId: selected.id,
        paymentMethod: method,
        note,
      })
      setResult({ status: 'success', data: response })
      setStep('result')
    } catch (e) {
      if (e.message.includes('hủy') || e.message.includes('cancel')) {
        setResult({ status: 'cancelled' })
        setStep('result')
      } else {
        setResult({ status: 'failed', message: e.message })
        setStep('result')
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  const handleBack = () => {
    if (step === 'method') setStep('select')
    else if (step === 'confirm') setStep('method')
  }

  // Step 1: Select Package
  if (step === 'select') {
    return (
      <div className="stack">
        <div className="section-intro">
          <span className="eyebrow">{t('THANH TOÁN')}</span>
          <h2>{t('Chọn gói tập phù hợp với bạn')}</h2>
          <p>{t('So sánh thời hạn và quyền lợi, sau đó tiến hành thanh toán.')}</p>
        </div>

        <div className="checkout-steps">
          <div className="checkout-step active">
            <span className="checkout-step-num">1</span>
            <span>{t('Chọn gói')}</span>
          </div>
          <div className="checkout-step-line" />
          <div className="checkout-step">
            <span className="checkout-step-num">2</span>
            <span>{t('Thanh toán')}</span>
          </div>
          <div className="checkout-step-line" />
          <div className="checkout-step">
            <span className="checkout-step-num">3</span>
            <span>{t('Xác nhận')}</span>
          </div>
        </div>

        <div className="grid-cards">
          {activePackages.map((pkg) => (
            <article className="pkg-card checkout-pkg" key={pkg.id}>
              <h3>{pkg.name}</h3>
              <div className="pkg-price">{formatMoney(pkg.price)}</div>
              <div className="muted small">
                {pkg.days} {t('ngày')}
              </div>
              <p>{pkg.description}</p>
              <button className="btn btn-primary full" onClick={() => handleSelectPackage(pkg)}>
                {t('Chọn gói này')}
              </button>
            </article>
          ))}
          {!activePackages.length && (
            <div className="card member-empty">{t('Chưa có gói tập đang mở bán.')}</div>
          )}
        </div>

        <button className="btn" onClick={() => goTo('payments')}>
          {t('Xem lịch sử giao dịch →')}
        </button>
      </div>
    )
  }

  // Step 2: Choose payment method
  if (step === 'method') {
    return (
      <div className="stack">
        <div className="section-intro">
          <span className="eyebrow">{t('THANH TOÁN')}</span>
          <h2>{t('Chọn phương thức thanh toán')}</h2>
        </div>

        <div className="checkout-steps">
          <div className="checkout-step done">
            <span className="checkout-step-num">✓</span>
            <span>{t('Chọn gói')}</span>
          </div>
          <div className="checkout-step-line active" />
          <div className="checkout-step active">
            <span className="checkout-step-num">2</span>
            <span>{t('Thanh toán')}</span>
          </div>
          <div className="checkout-step-line" />
          <div className="checkout-step">
            <span className="checkout-step-num">3</span>
            <span>{t('Xác nhận')}</span>
          </div>
        </div>

        <div className="checkout-layout">
          <div className="checkout-main">
            <div className="card stack">
              <h3>{t('Phương thức thanh toán')}</h3>
              <div className="payment-methods">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={`payment-method-card ${method === m.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)}
                    />
                    <span className="payment-method-icon">{m.icon}</span>
                    <span className="payment-method-label">{t(m.label)}</span>
                  </label>
                ))}
              </div>

              <label className="form">
                {t('Ghi chú (tuỳ chọn)')}
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} placeholder={t('Ghi chú cho giao dịch...')} />
              </label>
            </div>
          </div>

          <div className="checkout-sidebar">
            <div className="card stack">
              <h3>{t('Đơn hàng của bạn')}</h3>
              <div className="summary">
                <div>
                  <span>{t('Gói tập')}</span>
                  <strong>{selected?.name}</strong>
                </div>
                <div>
                  <span>{t('Thời hạn')}</span>
                  <strong>
                    {selected?.days} {t('ngày')}
                  </strong>
                </div>
                <div className="total">
                  <span>{t('Tổng cộng')}</span>
                  <strong>{formatMoney(selected?.price)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn" onClick={handleBack}>
            {t('← Quay lại')}
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            {t('Tiếp tục →')}
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Confirm
  if (step === 'confirm') {
    const methodLabel = PAYMENT_METHODS.find((m) => m.value === method)?.label || method

    return (
      <div className="stack">
        <div className="section-intro">
          <span className="eyebrow">{t('THANH TOÁN')}</span>
          <h2>{t('Xác nhận đơn hàng')}</h2>
        </div>

        <div className="checkout-steps">
          <div className="checkout-step done">
            <span className="checkout-step-num">✓</span>
            <span>{t('Chọn gói')}</span>
          </div>
          <div className="checkout-step-line active" />
          <div className="checkout-step done">
            <span className="checkout-step-num">✓</span>
            <span>{t('Thanh toán')}</span>
          </div>
          <div className="checkout-step-line active" />
          <div className="checkout-step active">
            <span className="checkout-step-num">3</span>
            <span>{t('Xác nhận')}</span>
          </div>
        </div>

        <div className="card stack" style={{ maxWidth: '600px' }}>
          <h3>{t('Tóm tắt đơn hàng')}</h3>
          <div className="summary">
            <div>
              <span>{t('Gói tập')}</span>
              <strong>{selected?.name}</strong>
            </div>
            <div>
              <span>{t('Thời hạn')}</span>
              <strong>
                {selected?.days} {t('ngày')}
              </strong>
            </div>
            <div>
              <span>{t('Mô tả')}</span>
              <strong>{selected?.description || '—'}</strong>
            </div>
            <div>
              <span>{t('Phương thức')}</span>
              <strong>{t(methodLabel)}</strong>
            </div>
            {note && (
              <div>
                <span>{t('Ghi chú')}</span>
                <strong>{note}</strong>
              </div>
            )}
            <div className="total">
              <span>{t('Tổng cộng')}</span>
              <strong>{formatMoney(selected?.price)}</strong>
            </div>
          </div>

          <div className="alert alert-info">
            {t('Tạo yêu cầu chưa trừ tiền thật. Thanh toán online hiện chỉ hỗ trợ mô phỏng. Gói được kích hoạt sau khi thanh toán được xác nhận.')}
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              {t(error)}
            </div>
          )}

          <div className="form-actions">
            <button className="btn" disabled={busy} onClick={handleBack}>
              {t('← Quay lại')}
            </button>
            <button className="btn btn-primary" disabled={busy} onClick={handleCheckout}>
              {t(busy ? 'Đang xử lý...' : 'Tạo yêu cầu thanh toán')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Result
  if (step === 'result') {
    const isSuccess = result?.status === 'success'
    const isCancelled = result?.status === 'cancelled'

    return (
      <div className="stack">
        <div className="checkout-result">
          <div className={`checkout-result-icon ${isSuccess ? 'success' : isCancelled ? 'cancelled' : 'failed'}`}>
            {isSuccess ? '✓' : isCancelled ? '✕' : '!'}
          </div>
          <h2>
            {t(
              isSuccess
                ? 'Đã tạo yêu cầu thanh toán!'
                : isCancelled
                  ? 'Giao dịch đã bị huỷ'
                  : 'Thanh toán thất bại'
            )}
          </h2>
          <p className="muted">
            {t(
              isSuccess
                ? 'Yêu cầu thanh toán đã được ghi nhận. Gói tập sẽ được kích hoạt sau khi thanh toán được xác nhận.'
                : isCancelled
                  ? 'Giao dịch đã bị huỷ. Bạn có thể thử lại bất cứ lúc nào.'
                  : result?.message || 'Đã có lỗi xảy ra trong quá trình thanh toán.'
            )}
          </p>

          {isSuccess && (
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <div className="summary">
                <div>
                  <span>{t('Gói tập')}</span>
                  <strong>{selected?.name}</strong>
                </div>
                <div>
                  <span>{t('Số tiền')}</span>
                  <strong>{formatMoney(selected?.price)}</strong>
                </div>
                <div>
                  <span>{t('Trạng thái')}</span>
                  <strong>
                    <span className="badge badge-amber">{t('Chờ thanh toán')}</span>
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="checkout-result-actions">
            <button className="btn btn-primary" onClick={() => goTo('payments')}>
              {t('Xem lịch sử giao dịch')}
            </button>
            <button
              className="btn"
              onClick={() => {
                setStep('select')
                setSelected(null)
                setResult(null)
                setError('')
              }}
            >
              {t(isSuccess ? 'Mua thêm gói khác' : 'Thử lại')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
