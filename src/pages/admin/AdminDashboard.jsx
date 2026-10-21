import { usePreferences } from '../../preferences/context'
import { useStore } from '../../store/context'
import Icon from '../../components/Icon'

export default function AdminDashboard({ goTo }) {
  const { t } = usePreferences()
  const { users, classes, packages, rooms, schedules, refresh } = useStore()

  const roleCount = (role) => users.filter((u) => u.role === role).length
  const stats = [
    ['users', 'Tổng tài khoản', users.length],
    ['ticket', 'Gói thành viên', packages.length],
    ['room', 'Phòng tập', rooms.length],
    ['calendar', 'Lớp học', classes.length],
  ]
  const roleSummary = [
    ['🛡️', 'Manager', roleCount('manager')],
    ['🏋️', 'Coach', roleCount('coach')],
    ['📝', 'Receptionist', roleCount('receptionist')],
    ['👤', 'Member', roleCount('member')],
  ]

  return (
    <div className="stack">
      <div className="dashboard-banner">
        <div>
          <span className="eyebrow">{t('BẢNG ĐIỀU KHIỂN ADMIN')}</span>
          <h3>{t('Quản lý hệ thống trung tâm thể thao')}</h3>
          <p>{t('Tạo tài khoản nhân sự, quản lý gói tập và theo dõi hoạt động.')}</p>
        </div>
        <button className="btn" onClick={refresh}>
          {t('Tải lại dữ liệu')}
        </button>
      </div>

      <div className="stats">
        {stats.map(([icon, label, count]) => (
          <div className="stat" key={label}>
            <div className="stat-icon">
              <Icon name={icon} />
            </div>
            <span>{t(label)}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <div className="card stack">
          <div className="card-head">
            <h3>{t('Phân bố tài khoản theo vai trò')}</h3>
          </div>
          <div className="role-summary">
            {roleSummary.map(([emoji, label, count]) => (
              <div className="role-summary-item" key={label}>
                <span className="role-emoji">{emoji}</span>
                <div>
                  <strong>{count}</strong>
                  <span>{t(label)}</span>
                </div>
                <div className="role-bar-track">
                  <div
                    className="role-bar-fill"
                    style={{ width: `${users.length ? (count / users.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card stack">
          <div className="card-head">
            <h3>{t('Thao tác nhanh')}</h3>
          </div>
          <div className="quick">
            <button className="btn btn-primary" onClick={() => goTo('staff')}>
              {t('+ Tạo tài khoản nhân sự')}
            </button>
            <button className="btn" onClick={() => goTo('packages')}>
              {t('Quản lý gói tập')}
            </button>
            <button className="btn" onClick={() => goTo('payments')}>
              {t('Thanh toán & Hóa đơn')}
            </button>
          </div>
          <div className="admin-info-cards">
            <div className="admin-info-card">
              <Icon name="shield" size={18} />
              <div>
                <strong>{t('Phân quyền')}</strong>
                <p>{t('Admin có toàn quyền quản lý tài khoản và cấu hình hệ thống.')}</p>
              </div>
            </div>
            <div className="admin-info-card">
              <Icon name="users" size={18} />
              <div>
                <strong>{t('Tạo tài khoản')}</strong>
                <p>{t('Chỉ Admin mới có quyền tạo tài khoản Manager, Coach, Receptionist.')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        {t('Lưu ý: Admin chỉ nên tạo tài khoản nhân sự (Manager, Coach, Receptionist). Hội viên tự đăng ký qua trang công khai.')}
      </div>
    </div>
  )
}
