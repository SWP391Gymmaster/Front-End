import { useState } from 'react'
import Layout from './components/Layout'
import { useStore } from './store/context'
import Login from './pages/Login'
import Register from './pages/Register'
import ManagerDashboard from './pages/manager/Dashboard'
import Reports from './pages/manager/Reports'
import Packages from './pages/manager/Packages'
import Rooms from './pages/manager/Rooms'
import Classes from './pages/manager/Classes'
import MemberHome from './pages/member/MemberHome'
import BuyPackage from './pages/member/BuyPackage'
import MemberSchedule from './pages/member/MemberSchedule'
import Profile from './pages/member/Profile'
import MemberSearch from './pages/receptionist/MemberSearch'
import CounterRegister from './pages/receptionist/CounterRegister'
import Payments from './pages/receptionist/Payments'
import CoachDashboard from './pages/coach/CoachDashboard'
import CoachSchedule from './pages/coach/CoachSchedule'
import MemberProvider from './store/MemberProvider'
import MemberPayments from './pages/Payments'

const MENUS = {
  manager: [
    { key: 'dashboard', label: 'Tổng quan doanh thu', icon: '📊', el: ManagerDashboard },
    { key: 'reports', label: 'Báo cáo & Tiến độ', icon: '📈', el: Reports },
    { key: 'packages', label: 'Gói thành viên', icon: '🎫', el: Packages },
    { key: 'rooms', label: 'Phòng tập', icon: '🏢', el: Rooms },
    { key: 'classes', label: 'Lớp học & Lịch', icon: '📅', el: Classes },
  ],
  receptionist: [
    { key: 'counter', label: 'Đăng ký tại quầy', icon: '📝', el: CounterRegister },
    { key: 'payments', label: 'Thanh toán', icon: '💳', el: Payments },
    { key: 'search', label: 'Hội viên & Gia hạn', icon: '🔎', el: MemberSearch },
  ],
  coach: [
    { key: 'dashboard', label: 'Tổng quan', icon: '🏋️', el: CoachDashboard },
    { key: 'schedule', label: 'Lịch dạy', icon: '📅', el: CoachSchedule },
  ],
  member: [
    { key: 'home', label: 'Trang của tôi', icon: '🏠', el: MemberHome },
    { key: 'buy', label: 'Gói tập', icon: '🎫', el: BuyPackage },
    { key: 'payments', label: 'Thanh toán & Hóa đơn', icon: '🧾', el: MemberPayments },
    { key: 'schedule', label: 'Đặt lớp & Lịch tập', icon: '📅', el: MemberSchedule },
    { key: 'profile', label: 'Hồ sơ', icon: '👤', el: Profile },
  ],
}

function RoleApp({ role, newMember }) {
  const [page, setPage] = useState(role === 'member' && newMember ? 'buy' : MENUS[role][0].key)
  const menu = MENUS[role]
  const Page = (menu.find((m) => m.key === page) || menu[0]).el
  return (
    <Layout menu={menu} page={page} setPage={setPage}>
      <Page goTo={setPage} />
    </Layout>
  )
}

function AuthScreens() {
  const [view, setView] = useState('login')
  return view === 'login' ? (
    <Login onRegister={() => setView('register')} />
  ) : (
    <Register onLogin={() => setView('login')} />
  )
}

export default function App() {
  const { session } = useStore()

  if (!session) return <AuthScreens />

  return <RoleApp key={session.email} role={session.role} initialPage={MENUS[session.role][0].key} />
  if (!session) return <AuthScreens />
  const content = <RoleApp key={session.email} role={session.role} newMember={session.newMember} />
  return session.role === 'member'
    ? <MemberProvider key={session.token}>{content}</MemberProvider>
    : content
}
