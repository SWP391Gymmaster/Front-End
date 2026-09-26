import { useStore } from '../store/context'
import { ROLE_LABELS } from '../store/roles'

export default function Layout({ menu, page, setPage, children }) {
  const { session, logout } = useStore()
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
              {m.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <div className="avatar">{(session.name || '?').trim().split(' ').pop()[0]}</div>
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
