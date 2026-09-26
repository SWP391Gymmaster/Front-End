import { useState } from 'react'
import Invoice from '../../components/Invoice'
import Modal from '../../components/Modal'
import { ErrorBox, Loading, MockBadge } from '../../components/Status'
import { packageApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { addDays, formatDate, formatMoney, getMembershipStatus, todayISO } from '../../store/utils'

const METHODS = ['Chuyển khoản QR', 'Thẻ ngân hàng', 'Ví MoMo']

export default function BuyPackage({ goTo }) {
  const { memberships, session, purchase } = useStore()
  // Danh sách gói: API thật. Thanh toán: dữ liệu tạm (Back-End chưa có API)
  const { data: packages, loading, error, reload } = useApi(() => packageApi.list())
  const status = getMembershipStatus(session.email, memberships)
  const [selected, setSelected] = useState(null)
  const [method, setMethod] = useState(METHODS[0])
  const [step, setStep] = useState('confirm') // confirm | processing | done
  const [result, setResult] = useState(null)

  const startDate = status.status === 'active' ? addDays(status.membership.endDate, 1) : todayISO()
  const active = (packages || []).filter((p) => p.active)

  const open = (p) => {
    setSelected(p)
    setStep('confirm')
    setResult(null)
  }

  const pay = () => {
    setStep('processing')
    setTimeout(() => {
      setResult(purchase({ email: session.email, pkg: selected, method, channel: 'Online' }))
      setStep('done')
    }, 1200)
  }

  return (
    <div className="stack">
      {status.status === 'none' && (
        <div className="alert alert-info">
          👋 Chào mừng <strong>{session.name}</strong>! Hãy chọn một gói tập để bắt đầu.
        </div>
      )}
      {status.status === 'active' && (
        <div className="alert alert-info">
          Gói hiện tại còn hạn đến <strong>{formatDate(status.membership.endDate)}</strong>. Mua thêm sẽ được cộng nối tiếp (gia hạn).
        </div>
      )}

      <ErrorBox error={error} onRetry={reload} />
      {loading && !packages && <Loading />}
      {packages && active.length === 0 && <p className="muted">Trung tâm chưa mở bán gói nào.</p>}

      <div className="grid-cards">
        {active.map((p, i) => (
          <div key={p.id} className={'pkg-card' + (i === 1 ? ' featured' : '')}>
            {i === 1 && <div className="ribbon">Phổ biến</div>}
            <h3>{p.name}</h3>
            <div className="pkg-price">{formatMoney(p.price)}</div>
            <div className="muted small">{p.durationDays} ngày · ~{formatMoney(Math.round(p.price / p.durationDays))}/ngày</div>
            <p>{p.description}</p>
            <button className="btn btn-primary full" onClick={() => open(p)}>
              {status.status === 'active' ? 'Gia hạn gói này' : 'Chọn gói này'}
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <Modal title={step === 'done' ? 'Thanh toán thành công' : 'Xác nhận thanh toán'} onClose={() => step !== 'processing' && setSelected(null)}>
          {step !== 'done' && (
            <div className="form">
              <div className="summary">
                <div><span>Gói tập</span><strong>{selected.name}</strong></div>
                <div><span>Hiệu lực</span><strong>{formatDate(startDate)} → {formatDate(addDays(startDate, selected.durationDays - 1))}</strong></div>
                <div className="total"><span>Tổng tiền</span><strong>{formatMoney(selected.price)}</strong></div>
              </div>
              <div className="field">
                <span>Phương thức thanh toán <MockBadge /></span>
                <div className="methods">
                  {METHODS.map((m) => (
                    <label key={m} className={'method' + (method === m ? ' on' : '')}>
                      <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
              {method === 'Chuyển khoản QR' && (
                <div className="qr-box">
                  <div className="qr" aria-hidden="true" />
                  <div className="small muted">Quét mã để thanh toán (mô phỏng)<br />Nội dung: GYM {session.email}</div>
                </div>
              )}
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => setSelected(null)} disabled={step === 'processing'}>Hủy</button>
                <button className="btn btn-primary" onClick={pay} disabled={step === 'processing'}>
                  {step === 'processing' ? 'Đang xử lý...' : `Thanh toán ${formatMoney(selected.price)}`}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div className="stack">
              <div className="success-mark">✔</div>
              <p className="center">Gói <strong>{selected.name}</strong> đã được kích hoạt.</p>
              <Invoice payment={result.payment} />
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => window.print()}>In hóa đơn</button>
                <button className="btn btn-primary" onClick={() => goTo('home')}>Về trang của tôi</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
