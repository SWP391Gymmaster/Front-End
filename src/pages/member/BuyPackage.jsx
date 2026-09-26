import { usePreferences } from '../../preferences/context'
import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { useStore } from '../../store/context'
import { addDays, formatDate, formatMoney, getMembershipStatus, todayISO } from '../../store/utils'

const METHODS = ['Chuyển khoản QR', 'Thẻ ngân hàng', 'Ví MoMo']

export default function BuyPackage({ goTo }) {
  const { t } = usePreferences()
  const { packages, memberships, currentUser, purchase } = useStore()
  const status = getMembershipStatus(currentUser.id, memberships)
  const [selected, setSelected] = useState(null)
  const [method, setMethod] = useState(METHODS[0])
  const [step, setStep] = useState('confirm') // confirm | processing | done
  const [result, setResult] = useState(null)

  const startDate = status.status === 'active' ? addDays(status.membership.endDate, 1) : todayISO()

  const open = (p) => {
    setSelected(p)
    setStep('confirm')
    setResult(null)
  }

  const pay = () => {
    setStep('processing')
    setTimeout(() => {
      const res = purchase({ userId: currentUser.id, packageId: selected.id, method, channel: 'Online' })
      setResult(res)
      setStep('done')
    }, 1200)
  }

  return (
    <div className="stack">
      {status.status === 'none' && (
        <div className="alert alert-info">{t("👋 Chào mừng ")}<strong>{currentUser.name}</strong>{t("! Tài khoản đã được tạo. Hãy chọn một gói tập để bắt đầu.")}</div>
      )}
      {status.status === 'active' && (
        <div className="alert alert-info">{t("Gói hiện tại còn hạn đến ")}<strong>{formatDate(status.membership.endDate)}</strong>{t(". Mua thêm sẽ được cộng nối tiếp (gia hạn).")}</div>
      )}

      <div className="grid-cards">
        {packages.filter((p) => p.active).map((p, i) => (
          <div key={p.id} className={'pkg-card' + (i === 1 ? ' featured' : '')}>
            {i === 1 && <div className="ribbon">{t("Phổ biến")}</div>}
            <h3>{p.name}</h3>
            <div className="pkg-price">{formatMoney(p.price)}</div>
            <div className="muted small">{p.days}{t(" ngày · ~")}{formatMoney(Math.round(p.price / p.days))}{t("/ngày")}</div>
            <p>{p.description}</p>
            <button className="btn btn-primary full" onClick={() => open(p)}>
              {t(status.status === 'active' ? 'Gia hạn gói này' : 'Chọn gói này')}
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <Modal title={step === 'done' ? 'Thanh toán thành công' : 'Xác nhận thanh toán'} onClose={() => step !== 'processing' && setSelected(null)}>
          {step !== 'done' && (
            <div className="form">
              <div className="summary">
                <div><span>{t("Gói tập")}</span><strong>{selected.name}</strong></div>
                <div><span>{t("Hiệu lực")}</span><strong>{formatDate(startDate)} → {formatDate(addDays(startDate, selected.days - 1))}</strong></div>
                <div className="total"><span>{t("Tổng tiền")}</span><strong>{formatMoney(selected.price)}</strong></div>
              </div>
              <div className="field">
                <span>{t("Phương thức thanh toán")}</span>
                <div className="methods">
                  {METHODS.map((m) => (
                    <label key={m} className={'method' + (method === m ? ' on' : '')}>
                      <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
                      {t(m)}
                    </label>
                  ))}
                </div>
              </div>
              {method === 'Chuyển khoản QR' && (
                <div className="qr-box">
                  <div className="qr" aria-hidden="true" />
                  <div className="small muted">{t("Quét mã để thanh toán (mô phỏng)")}<br />{t("Nội dung: GYM ")}{currentUser.phone}</div>
                </div>
              )}
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => setSelected(null)} disabled={step === 'processing'}>{t("Hủy")}</button>
                <button className="btn btn-primary" onClick={pay} disabled={step === 'processing'}>
                  {t(step === 'processing' ? 'Đang xử lý...' : `Thanh toán ${formatMoney(selected.price)}`)}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div className="stack">
              <div className="success-mark">✔</div>
              <p className="center">{t("Gói ")}<strong>{selected.name}</strong>{t(" đã được kích hoạt.")}</p>
              <Invoice payment={result.payment} membership={result.membership} />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => window.print()}>{t("In hóa đơn")}</button>
                <button className="btn btn-primary" onClick={() => goTo('home')}>{t("Về trang của tôi")}</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
