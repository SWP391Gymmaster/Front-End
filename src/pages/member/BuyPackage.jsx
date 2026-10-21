import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { ErrorBox, Loading } from '../../components/Status'
import { packageApi, paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { usePreferences } from '../../preferences/context'
import { addDays, formatDate, formatMoney, todayISO } from '../../store/utils'

const METHODS = [
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản QR' },
  { value: 'CREDIT_CARD', label: 'Thẻ ngân hàng' },
  { value: 'MOMO', label: 'Ví MoMo' },
  { value: 'VNPAY', label: 'VNPay' },
]

export default function BuyPackage({ goTo }) {
  const { session } = useStore()
  const { t } = usePreferences?.() || { t: (s) => s }

  const { data, loading, error, reload } = useApi(() =>
    Promise.all([packageApi.list(), paymentApi.myMemberships()]).then(([packages, memberships]) => ({
      packages,
      memberships,
    })),
  )

  const [selected, setSelected] = useState(null)
  const [method, setMethod] = useState(METHODS[0].value)
  const [note, setNote] = useState('')
  const [step, setStep] = useState('confirm')
  const [pendingPayment, setPendingPayment] = useState(null)
  const [result, setResult] = useState(null)
  const [actionError, setActionError] = useState('')
  const [paying, setPaying] = useState(false)

  const memberships = data?.memberships || []
  const latestMembership = [...memberships].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]
  const activeMembership = memberships.find((membership) => membership.active)
  
  const startDate = latestMembership?.endDate >= todayISO()
    ? addDays(latestMembership.endDate, 1)
    : todayISO()

  const activePackages = (data?.packages || []).filter((pkg) => pkg.active !== false)

  const open = (pkg) => {
    setSelected(pkg)
    setStep('confirm')
    setPendingPayment(null)
    setResult(null)
    setActionError('')
    setNote('')
  }

  const pay = async () => {
    if (!selected || paying) return
    setPaying(true)
    setActionError('')
    let paymentToReconcile = pendingPayment

    try {
      let payment = pendingPayment
      if (!payment) {
        payment = await paymentApi.checkout({
          packageId: selected.id,
          paymentMethod: method,
          note: note || `Đăng ký gói ${selected.name}`,
        })
        paymentToReconcile = payment
        setPendingPayment(payment)
      }

      setStep('processing')
      const completed = await paymentApi.simulatePayment(payment.paymentId)
      if (completed.status !== 'COMPLETED') {
        throw new Error('Thanh toán chưa được xác nhận; gói tập chưa được kích hoạt')
      }
      setResult(completed)
      setStep('done')
      await reload()
    } catch (err) {
      if (paymentToReconcile?.paymentId) {
        try {
          const latestPayments = await paymentApi.myPayments()
          const reconciled = latestPayments.find((item) => item.paymentId === paymentToReconcile.paymentId)
          if (reconciled?.status === 'COMPLETED') {
            setResult(reconciled)
            setStep('done')
            await reload()
            return
          }
        } catch {
          // Bỏ qua lỗi nếu không kiểm tra được trạng thái
        }
      }
      setStep('confirm')
      setActionError(err.message)
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="stack">
      <div className="section-intro">
        <span className="eyebrow">{t('ĐẦU TƯ CHO CHÍNH BẠN')}</span>
        <h2>{t('Một gói tập. Nhiều khởi đầu mới.')}</h2>
        <p>{t('So sánh thời hạn và quyền lợi để tìm gói tập phù hợp với bạn.')}</p>
      </div>

      {!activeMembership ? (
        <div className="alert alert-info">
          {latestMembership ? (
            <>Gói gần nhất đã hết hạn ngày <strong>{formatDate(latestMembership.endDate)}</strong>. Chọn gói để gia hạn và tiếp tục đặt lớp.</>
          ) : (
            <>Chào mừng <strong>{session?.name || 'Hội viên'}</strong>! Hãy chọn gói tập để kích hoạt tài khoản hội viên.</>
          )}
        </div>
      ) : (
        <div className="alert alert-info">
          Gói hiện tại còn hạn đến <strong>{formatDate(activeMembership.endDate)}</strong>. Gói mua thêm sẽ được nối tiếp sau ngày hết hạn.
        </div>
      )}

      <ErrorBox error={error} onRetry={reload} />
      {loading && !data && <Loading />}

      <div className="grid-cards">
        {activePackages.map((pkg, index) => (
          <article key={pkg.id} className={'pkg-card' + (index === 1 ? ' featured' : '')}>
            {index === 1 && <div className="ribbon">Phổ biến</div>}
            <h3>{pkg.name}</h3>
            <div className="pkg-price">{formatMoney(pkg.price)}</div>
            <div className="muted small">
              {pkg.durationDays || pkg.days} {t('ngày')} · ~{formatMoney(Math.round(pkg.price / (pkg.durationDays || pkg.days || 1)))}/ngày
            </div>
            <p>{pkg.description}</p>
            <button className="btn btn-primary full" onClick={() => open(pkg)}>
              {activeMembership ? t('Gia hạn gói này') : t('Chọn gói tập')}
            </button>
          </article>
        ))}

        {data && activePackages.length === 0 && (
          <div className="card member-empty">
            {t('Chưa có gói tập đang mở bán.')}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button className="btn" onClick={() => goTo('payments')}>
          {t('Thanh toán & Hóa đơn')}
        </button>
      </div>

      {selected && (
        <Modal
          title={step === 'done' ? 'Thanh toán thành công' : 'Xác nhận chọn gói'}
          onClose={() => !paying && !pendingPayment && step !== 'processing' && setSelected(null)}
        >
          {step !== 'done' ? (
            <div className="form stack">
              <div className="summary">
                <div><span>Gói tập</span><strong>{selected.name}</strong></div>
                <div><span>Hiệu lực dự kiến</span><strong>{formatDate(startDate)} → {formatDate(addDays(startDate, (selected.durationDays || selected.days || 1) - 1))}</strong></div>
                <div className="total"><span>Tổng tiền</span><strong>{formatMoney(selected.price)}</strong></div>
              </div>

              <div className="field">
                <span>{t('Phương thức thanh toán')}</span>
                <div className="methods">
                  {METHODS.map((item) => (
                    <label key={item.value} className={'method' + (method === item.value ? ' on' : '')}>
                      <input
                        type="radio"
                        name="method"
                        checked={method === item.value}
                        onChange={() => setMethod(item.value)}
                        disabled={Boolean(pendingPayment) || paying}
                      />
                      {t(item.label)}
                    </label>
                  ))}
                </div>
              </div>

              <label>
                {t('Ghi chú')}
                <textarea
                  value={note}
                  disabled={paying || Boolean(pendingPayment)}
                  maxLength={500}
                  placeholder="Ghi chú thêm (không bắt buộc)..."
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>

              {method === 'BANK_TRANSFER' && (
                <div className="qr-box">
                  <div className="qr" aria-hidden="true" />
                  <div className="small muted">
                    Thanh toán mô phỏng qua hệ thống demo<br />
                    Tài khoản: {session?.email}
                  </div>
                </div>
              )}

              {pendingPayment && (
                <div className="alert alert-info">
                  Hóa đơn {pendingPayment.invoiceCode} đang chờ xác nhận. Thử xác nhận lại sẽ tiếp tục giao dịch hiện tại, không tạo hóa đơn mới.
                </div>
              )}

              {actionError && <div className="alert alert-error">{actionError}</div>}

              <div className="form-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => setSelected(null)}
                  disabled={paying || Boolean(pendingPayment)}
                >
                  Hủy
                </button>
                <button className="btn btn-primary" onClick={pay} disabled={paying}>
                  {paying ? 'Đang xử lý...' : `${pendingPayment ? 'Thử xác nhận lại' : 'Thanh toán'} ${formatMoney(selected.price)}`}
                </button>
              </div>
            </div>
          ) : result && (
            <div className="stack">
              <div className="success-mark">✔</div>
              <p className="center">Gói <strong>{selected.name}</strong> đã được thanh toán và kích hoạt.</p>
              <Invoice payment={result} />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => window.print()}>In hóa đơn</button>
                <button className="btn btn-primary" onClick={() => goTo('schedule')}>Đặt lớp học</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}