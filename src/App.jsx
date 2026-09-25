import { useState } from 'react'
import Layout from './components/Layout'
import { useStore } from './store/context'
import { getMembershipStatus } from './store/utils'
import Login from './pages/Login'
import Register from './pages/Register'
import ManagerDashboard from './pages/manager/Dashboard'
import Packages from './pages/manager/Packages'
import Rooms from './pages/manager/Rooms'
import Classes from './pages/manager/Classes'
import MemberHome from './pages/member/MemberHome'
import BuyPackage from './pages/member/BuyPackage'
import MemberSchedule from './pages/member/MemberSchedule'
import Profile from './pages/member/Profile'
import MemberSearch from './pages/receptionist/MemberSearch'
import CounterRegister from './pages/receptionist/CounterRegister'
import Invoices from './pages/receptionist/Invoices'
import CoachSchedule from './pages/coach/CoachSchedule'

const MENUS = {
  manager: [
    { key: 'dashboard', label: 'Tổng quan', icon: '📊', el: ManagerDashboard },
    { key: 'packages', label: 'Gói thành viên', icon: '🎫', el: Packages },
    { key: 'rooms', label: 'Phòng tập', icon: '🏢', el: Rooms },
    { key: 'classes', label: 'Lớp học & Lịch', icon: '📅', el: Classes },
  ],
  receptionist: [
    { key: 'counter', label: 'Đăng ký tại quầy', icon: '📝', el: CounterRegister },
    { key: 'search', label: 'Tra cứu hội viên', icon: '🔎', el: MemberSearch },
    { key: 'invoices', label: 'Hóa đơn', icon: '🧾', el: Invoices },
  ],
  coach: [{ key: 'schedule', label: 'Lịch dạy', icon: '📅', el: CoachSchedule }],
  member: [
    { key: 'home', label: 'Trang của tôi', icon: '🏠', el: MemberHome },
    { key: 'buy', label: 'Gói tập', icon: '🎫', el: BuyPackage },
    { key: 'schedule', label: 'Lịch lớp học', icon: '📅', el: MemberSchedule },
    { key: 'profile', label: 'Hồ sơ', icon: '👤', el: Profile },
  ],
}

function RoleApp({ user, initialPage }) {
  const [page, setPage] = useState(initialPage)
  const menu = MENUS[user.role]
  const Page = (menu.find((m) => m.key === page) || menu[0]).el
  return (
    <Layout menu={menu} page={page} setPage={setPage}>
      <Page goTo={setPage} />
    </Layout>
  )
}

function AuthScreens() {
  const [authView, setAuthView] = useState('login')
  return authView === 'login' ? (
    <Login onRegister={() => setAuthView('register')} />
  ) : (
    <Register onLogin={() => setAuthView('login')} />
  )
}

export default function App() {
  const { currentUser, memberships } = useStore()

  if (!currentUser) return <AuthScreens />

  let initialPage = MENUS[currentUser.role][0].key
  // Member mới chưa có gói: đưa thẳng tới trang chọn gói
  if (currentUser.role === 'member' && getMembershipStatus(currentUser.id, memberships).status === 'none') {
    initialPage = 'buy'
  }

  return <RoleApp key={currentUser.id} user={currentUser} initialPage={initialPage} />
}
