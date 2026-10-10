import { useStore } from '../store/context'
import { ROLE_LABELS } from '../store/roles'
import Avatar from './Avatar'
import { usePreferences } from '../preferences/context'

export default function Layout({ menu, page, setPage, children }) {
  const { session, logout, currentUser } = useStore()
  const { t } = usePreferences()
  const current = menu.find((m) => m.key === page)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">GM</span>
          <span className="brand-text">GymMaster</span>
        </div>
        <nav>
          {menu.map((m) => (
            <button
              key={m.key}
              className={'nav-item' + (m.key === page ? ' active' : '')}
              onClick={() => setPage(m.key)}
            >
              <span className="nav-icon">{m.icon}</span>
              {session.role === 'member' ? t(m.label) : m.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <Avatar name={session.name} src={currentUser?.avatarUrl} />
            <div>
              <div className="user-name">{session.name}</div>
              <div className="user-role">{ROLE_LABELS[session.role]}</div>
            </div>
          </div>
          <button className="btn btn-ghost full" onClick={logout}>
            Đăng xuất
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <h1>{current?.label}</h1>
          <span className="role-pill">{ROLE_LABELS[session.role]}</span>
        </header>
        <div className="content">{children}</div>
      </main>
    </div>
  )
}
