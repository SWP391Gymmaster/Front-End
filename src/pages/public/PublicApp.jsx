import { useEffect, useState } from 'react'
import { publicService } from '../../services/publicService'
import { useStore } from '../../store/context'
import { LoginForm, RegisterForm } from './AuthForms'
import '../../public.css'

const emailVerificationRequests = new Map()
function verifyEmailOnce(token) {
  if (!emailVerificationRequests.has(token)) {
    emailVerificationRequests.set(token, publicService.verifyEmail(token))
  }
  return emailVerificationRequests.get(token)
}

function useCatalog(kind) {
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    publicService[kind]().then(data => { if (active) setResult({ data }) }, e => { if (active) setResult({ error: e.message }) })
    return () => { active = false }
  }, [kind, attempt])
  return { ...result, retry: () => { setResult(null); setAttempt(n => n + 1) } }
}
function Packages() {
  const { data, error, retry } = useCatalog('packages')
  return <section className="fe1-section" id="plans"><div className="fe1-section-head"><div><span className="fe1-eyebrow">MEMBERSHIP</span><h2>Gói tập dành cho bạn</h2></div><p>Khám phá trước. Quyết định khi bạn sẵn sàng.</p></div>
    {error ? <div className="fe1-feedback" role="alert">{error} <button onClick={retry}>Thử lại</button></div> : !data ? <p role="status">Đang tải gói tập…</p> : !data.length ? <p>Chưa có gói tập đang mở bán.</p> : <div className="fe1-cards">{data.map(p => <article className="fe1-plan" key={p.id}><span>{p.durationDays} ngày trải nghiệm</span><h3>{p.name}</h3><strong>{Number(p.price).toLocaleString('vi-VN')} đ</strong><p>{p.description || 'Xem thông tin và chọn gói sau khi đăng nhập.'}</p><a href="#/login" className="fe1-button fe1-secondary">Đăng nhập để chọn gói →</a></article>)}</div>}
  </section>
}
function Home() {
  return <><section className="fe1-hero"><div><span className="fe1-eyebrow">MOVE WITH PURPOSE</span><h1>Mỗi ngày<br />một phiên bản<br /><em>khỏe hơn.</em></h1><p>Không gian dành cho hành trình của bạn. Tìm bộ môn phù hợp và bắt đầu theo nhịp riêng.</p><div className="fe1-actions"><a className="fe1-button" href="#plans" onClick={e => { e.preventDefault(); document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }) }}>Khám phá gói tập ↘</a><a className="fe1-text-link" href="#/register">Tạo tài khoản miễn phí</a></div></div><div className="fe1-hero-art" aria-hidden="true"><div className="fe1-orbit" /><div className="fe1-weight"><i /><b /><i /></div><span>STRENGTH<br />BALANCE<br />ENERGY</span><small>YOUR NEXT CHAPTER STARTS HERE</small></div></section>
    <section className="fe1-section"><span className="fe1-eyebrow">FIND YOUR MOVEMENT</span><h2>Chọn cách bạn muốn vận động</h2><div className="fe1-cards">{[
      ['01', 'Gym', 'Rèn luyện sức mạnh với khu vực tạ và máy tập. Phù hợp để xây dựng thể lực và duy trì thói quen vận động.', '/images/gym.avif', 'Khu vực tập gym với máy tập và tạ'],
      ['02', 'Yoga', 'Kết hợp chuyển động, hơi thở và sự tập trung để cải thiện độ linh hoạt, cân bằng và thư giãn.', '/images/yoga.webp', 'Không gian tập yoga yên tĩnh'],
      ['03', 'Boxing', 'Làm quen với kỹ thuật đấm bốc trong bài tập giàu năng lượng, giúp tăng sức bền và phản xạ.', '/images/boxing.avif', 'Buổi tập boxing với bao cát và găng tay'],
    ].map(([n, title, description, image, alt]) => <article className="fe1-discipline" key={n}><img className="fe1-discipline-image" src={image} alt={alt} loading="lazy" /><span>{n} / BỘ MÔN</span><h3>{title}</h3><p>{description}</p></article>)}</div><p>Đăng nhập để xem danh sách lớp và lịch tập hiện có.</p><a className="fe1-text-link" href="#/login">Đăng nhập để tiếp tục →</a></section><Packages /><section className="fe1-banner"><h2>Bước đầu không cần hoàn hảo.<br />Chỉ cần bắt đầu.</h2><a className="fe1-button" href="#/register">Tạo tài khoản</a></section></>
}
function ClassesRequiresLogin() {
  return <section className="fe1-section fe1-classes"><div className="fe1-empty"><h1>Đăng nhập để xem danh sách lớp</h1><p>Danh sách lớp và lịch tập được hiển thị sau khi bạn đăng nhập.</p><a className="fe1-button" href="#/login">Đăng nhập</a></div></section>
}
function EmailVerificationPage() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [state, setState] = useState({ busy: true, success: false, message: '' })
  useEffect(() => {
    let active = true
    if (!token) return () => { active = false }
    verifyEmailOnce(token).then(result => {
      if (active) setState({ busy: false, success: true, message: result?.message || 'Email đã được xác minh thành công.' })
    }).catch(error => {
      if (active) setState({ busy: false, success: false, message: error.message })
    })
    return () => { active = false }
  }, [token])
  const busy = !!token && state.busy
  const success = !!token && state.success
  const message = token ? state.message : 'Liên kết xác minh không có token.'
  return <section className="fe1-empty" aria-live="polite">
    <h1>{busy ? 'Đang xác minh email…' : success ? 'Xác minh email thành công' : 'Không thể xác minh email'}</h1>
    <p>{busy ? 'Vui lòng chờ trong giây lát.' : message}</p>
    {!busy && <a className="fe1-button" href={success ? '#/login' : '#/register'}>{success ? 'Đến trang đăng nhập' : 'Quay lại đăng ký'}</a>}
  </section>
}
function PaymentResultPage() {
  const { currentUser, paymentService } = useStore()
  const query = new URLSearchParams(window.location.hash.split('?')[1] || '')
  const accepted = query.get('success') === 'true'
  const paymentCode = query.get('paymentCode') || ''
  const [state, setState] = useState({ loading: accepted && !!currentUser, status: '' })
  useEffect(() => {
    let active = true
    let timer
    if (!accepted || !currentUser || !paymentCode) return () => { active = false }
    let attempt = 0
    const check = async () => {
      try {
        const data = await paymentService.list()
        const payment = data.payments.find(item => item.paymentCode === paymentCode)
        if (payment?.status === 'COMPLETED') {
          if (active) setState({ loading: false, status: 'Thanh toán thành công. Gói tập đã được cập nhật.' })
          return
        }
        if (payment && ['FAILED', 'CANCELLED'].includes(payment.status)) {
          if (active) setState({ loading: false, status: 'Giao dịch không hoàn tất. Bạn có thể thử thanh toán lại.' })
          return
        }
      } catch (error) {
        if (active) setState({ loading: false, status: `Chưa tải được trạng thái giao dịch: ${error.message}` })
        return
      }
      attempt += 1
      if (attempt < 6) timer = setTimeout(check, 1500)
      else if (active) setState({ loading: false, status: 'VNPay đã phản hồi; hệ thống đang cập nhật. Hãy xem lại mục Thanh toán & Hóa đơn sau ít phút.' })
    }
    void check()
    return () => { active = false; clearTimeout(timer) }
  }, [accepted, currentUser, paymentCode, paymentService])
  const waiting = accepted && !!currentUser && !!paymentCode && state.loading
  const status = !accepted ? 'Giao dịch bị hủy hoặc VNPay không xác nhận thanh toán.' : !currentUser || !paymentCode ? 'VNPay đã nhận thanh toán. Đăng nhập để kiểm tra trạng thái giao dịch.' : state.status
  return <section className="fe1-empty" aria-live="polite"><h1>{waiting ? 'Đang kiểm tra thanh toán…' : accepted ? 'Kết quả thanh toán' : 'Thanh toán chưa hoàn tất'}</h1><p>{waiting ? 'Đang chờ VNPay cập nhật kết quả về hệ thống.' : status}</p><a className="fe1-button" href="/">Quay lại GymMaster</a></section>
}
export default function PublicApp() {
  const [hash, setHash] = useState(() => window.location.hash)
  const [dark, setDark] = useState(false)
  useEffect(() => { const update = () => setHash(window.location.hash); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update) }, [])
  const [path] = hash.replace(/^#/, '').split('?')
  const route = path || (window.location.pathname.endsWith('/verify-email') ? '/verify-email' : '/home')
  useEffect(() => { window.scrollTo(0, 0); document.title = `GymMaster | ${route === '/classes' ? 'Đăng nhập để xem lớp' : route === '/register' ? 'Đăng ký' : route === '/login' ? 'Đăng nhập' : route === '/verify-email' ? 'Xác minh email' : route === '/payment-result' ? 'Kết quả thanh toán' : 'Trang chủ'}` }, [route])
  return <div className={`fe1-site ${dark ? 'fe1-dark' : ''}`}><a className="fe1-skip" href="#fe1-content" onClick={e => { e.preventDefault(); document.getElementById("fe1-content")?.focus() }}>Bỏ qua điều hướng</a><header className="fe1-nav"><a className="fe1-brand" href="#/home"><span>GM</span>GYMMASTER</a><nav aria-label="Điều hướng chính"><a href="#/home" aria-current={route === '/home' ? 'page' : undefined}>Trang chủ</a><a href="#/login" aria-current={route === '/login' ? 'page' : undefined}>Đăng nhập</a><a className="fe1-button" href="#/register">Đăng ký</a><button className="fe1-theme" aria-label={dark ? 'Bật giao diện sáng' : 'Bật giao diện tối'} onClick={() => setDark(v => !v)}>{dark ? '☀' : '☾'}</button></nav></header><main id="fe1-content" tabIndex={-1}>
    {route === '/home' ? <Home /> : route === '/classes' ? <ClassesRequiresLogin /> : route === '/register' ? <RegisterForm /> : route === '/login' ? <LoginForm /> : route === '/verify-email' ? <EmailVerificationPage /> : route === '/payment-result' ? <PaymentResultPage /> : <section className="fe1-empty"><h1>Không tìm thấy trang</h1><a href="#/home">Về trang chủ</a></section>}
  </main><footer className="fe1-footer"><strong>GYMMASTER</strong><p>Chuyển động hôm nay. Khỏe hơn mỗi ngày.</p></footer></div>
}
