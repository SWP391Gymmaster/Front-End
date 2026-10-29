import { useState } from 'react'
import { ROLES } from '../data/seed'
import { useStore } from '../store/context'
import { usePreferences } from '../preferences/context'
import PreferencesControls from './PreferencesControls'
import Icon from './Icon'
import Avatar from './Avatar'

const icons = { dashboard: 'grid', packages: 'ticket', rooms: 'room', classes: 'calendar', counter: 'receipt', search: 'search', invoices: 'receipt', schedule: 'calendar', home: 'grid', buy: 'ticket', profile: 'user', staff: 'users', users: 'users', payments: 'receipt', reports: 'trend' }

export default function Layout({ menu, page, setPage, children }) {
  const { currentUser, logout } = useStore()
  const { t } = usePreferences()
  const [menuOpen, setMenuOpen] = useState(false)
  const current = menu.find((m) => m.key === page)
  return <div className="app-shell">
    {menuOpen && <button className="sidebar-scrim" aria-label={t('Đóng')} onClick={() => setMenuOpen(false)} />}
    <aside id="main-navigation" className={'sidebar' + (menuOpen ? ' is-open' : '')}>
      <div className="brand"><span className="brand-logo"><Icon name="dumbbell" /></span><span className="brand-text">Gym<span>Master</span><small>FITNESS MANAGEMENT</small></span></div>
      <div className="sidebar-workspace"><span className="workspace-avatar">G</span><div><strong>GymMaster Club</strong><small><span className="live-dot" />{t('Không gian quản lý')}</small></div></div>
      <div className="nav-caption">{t('KHÔNG GIAN LÀM VIỆC')}</div>
      <nav aria-label={t('Điều hướng chính')}>{menu.map((m) => <button key={m.key} className={'nav-item' + (m.key === page ? ' active' : '')} aria-current={m.key === page ? 'page' : undefined} onClick={() => { setPage(m.key); setMenuOpen(false) }}><Icon name={icons[m.key]} /><span>{t(m.label)}</span>{m.key === page && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-note"><Icon name="dumbbell" size={24} /><strong>{t('Mỗi ngày, tốt hơn một chút.')}</strong><p>{t('Cùng xây dựng một cộng đồng khỏe mạnh hơn.')}</p></div>
      <div className="sidebar-foot"><div className="user-chip"><Avatar name={currentUser.name} src={currentUser.avatarUrl} /><div><div className="user-name">{currentUser.name}</div><div className="user-role">{t(ROLES[currentUser.role])}</div></div><button className="logout-button" onClick={logout} aria-label={t('Đăng xuất')} title={t('Đăng xuất')}><Icon name="logout" size={19} /></button></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="topbar-title"><button className="theme-toggle mobile-menu" aria-expanded={menuOpen} aria-controls="main-navigation" aria-label={t('Mở menu')} onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'close' : 'menu'} /></button><div><div className="breadcrumb">{t('Không gian quản lý')} <span>/</span> {t(ROLES[currentUser.role])}</div><h1>{t(current?.label)}</h1></div></div><div className="topbar-actions"><PreferencesControls /><Avatar name={currentUser.name} src={currentUser.avatarUrl} className="topbar-avatar" /></div></header>
      <div className="content"><div className="page-heading"><div><span className="eyebrow muted">GYMMASTER WORKSPACE</span><h2>{t('Xin chào')}, {currentUser.name.split(' ').pop()} <span className="greeting-dot">✦</span></h2><p>{t('Sẵn sàng cho một ngày tràn đầy năng lượng.')}</p></div><span className="date-chip"><Icon name="calendar" size={16} />{new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</span></div>{children}<footer className="workspace-footer"><span>© {new Date().getFullYear()} GymMaster</span><span>{t('Kết nối vận hành. Nâng tầm trải nghiệm.')}</span></footer></div>
    </main>
  </div>
}
