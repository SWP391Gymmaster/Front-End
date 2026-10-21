import { useState } from 'react'
import { publicService } from '../../services/publicService'

// The current Back-End verifies email with a one-time link token, not a numeric OTP.
export default function EmailVerificationModal({ email, deliveryStatus, onClose }) {
  const [message, setMessage] = useState(deliveryStatus === 'FAILED'
    ? 'Back-End chưa gửi được email xác minh. Hãy kiểm tra cấu hình SMTP Gmail rồi thử gửi lại.'
    : 'Hãy mở Gmail và nhấn vào liên kết xác minh để kích hoạt tài khoản.')
  const [error, setError] = useState(deliveryStatus === 'FAILED')
  const [busy, setBusy] = useState(false)

  async function resend() {
    if (busy) return
    setBusy(true); setError(false); setMessage('')
    try {
      await publicService.resendVerification(email)
      setMessage('Đã tiếp nhận yêu cầu gửi lại. Hãy kiểm tra hộp thư đến và thư rác.')
    } catch (e) {
      setError(true); setMessage(e.message)
    } finally { setBusy(false) }
  }

  return <div className="fe1-modal-backdrop"><section className="fe1-otp-modal" role="dialog" aria-modal="true" aria-labelledby="verify-title">
    <span className="fe1-check" aria-hidden="true">✉</span><span className="fe1-eyebrow">EMAIL VERIFICATION</span>
    <h2 id="verify-title">Kiểm tra email</h2>
    <p>Email xác minh được gửi đến <strong>{email}</strong>. Mở email và nhấn liên kết để xác minh tài khoản.</p>
    {message && <p className={error ? 'fe1-feedback' : 'fe1-otp-message'} role={error ? 'alert' : 'status'}>{message}</p>}
    <button className="fe1-otp-resend" disabled={busy} onClick={resend}>{busy ? 'Đang gửi…' : 'Gửi lại email xác minh'}</button>
    <button className="fe1-button" onClick={onClose}>Đã hiểu</button>
  </section></div>
}
