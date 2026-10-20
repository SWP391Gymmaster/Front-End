import { useEffect, useRef, useState } from 'react'
import { publicService } from '../../services/publicService'

export default function OtpVerificationModal({ email, onVerified }) {
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const lock = useRef(false)

  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function verify(e) {
    e.preventDefault()
    if (lock.current) return
    if (!/^\d{6}$/.test(otp)) { setError(true); setMessage('Vui lòng nhập đủ mã OTP 6 chữ số.'); return }
    lock.current = true; setBusy(true); setError(false); setMessage('')
    try {
      const status = await publicService.verifyOtp(email, otp)
      if (status === 'verified') onVerified()
      else if (status === 'expired') { setError(true); setMessage('Mã OTP đã hết hạn. Hãy gửi lại mã mới.') }
      else if (status === 'locked') { setError(true); setMessage('Bạn đã nhập sai quá số lần cho phép. Hãy gửi lại mã mới.') }
      else { setError(true); setMessage('Mã OTP không đúng. Vui lòng kiểm tra lại Gmail.') }
    } catch (e) { setError(true); setMessage(e.message) }
    finally { lock.current = false; setBusy(false) }
  }

  async function resend() {
    if (busy || cooldown) return
    setBusy(true); setError(false); setMessage('')
    try {
      await publicService.resendOtp(email)
      setOtp(''); setCooldown(60); setMessage('Đã gửi mã OTP mới. Hãy kiểm tra hộp thư đến hoặc thư rác.')
    } catch (e) { setError(true); setMessage(e.message) }
    finally { setBusy(false) }
  }

  return <div className="fe1-modal-backdrop"><section className="fe1-otp-modal" role="dialog" aria-modal="true" aria-labelledby="otp-title" aria-describedby="otp-help">
    <span className="fe1-check" aria-hidden="true">✉</span><span className="fe1-eyebrow">EMAIL VERIFICATION</span>
    <h2 id="otp-title">Nhập mã OTP</h2>
    <p id="otp-help">Mã 6 chữ số đã được gửi đến <strong>{email}</strong>. Mã có hiệu lực 10 phút. Hãy kiểm tra cả thư rác.</p>
    <form className="fe1-form" onSubmit={verify}>
      <label htmlFor="register-otp">Mã OTP</label>
      <input id="register-otp" className="fe1-otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} autoFocus value={otp} disabled={busy} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setMessage('') }} placeholder="000000" />
      <button className="fe1-button" disabled={busy}>{busy ? 'Đang xác minh…' : 'Xác minh email'}</button>
    </form>
    <button className="fe1-otp-resend" disabled={busy || cooldown > 0} onClick={resend}>{cooldown ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã OTP'}</button>
    {message && <p className={error ? 'fe1-feedback' : 'fe1-otp-message'} role={error ? 'alert' : 'status'}>{message}</p>}
  </section></div>
}
