import { usePreferences } from '../../preferences/context'
import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus } from '../../store/utils'
import Icon from '../../components/Icon'

export default function Dashboard({ goTo }) {
  const { t } = usePreferences()
  const { users, classes, packages, rooms, payments, memberships } = useStore()
  const members = users.filter((u) => u.role === 'member')
  const coaches = users.filter((u) => u.role === 'coach')
  const activeMembers = members.filter((m) => getMembershipStatus(m.id, memberships).status === 'active')
  const revenue = payments.reduce((s, p) => s + p.amount, 0)
  const recent = [...payments].reverse().slice(0, 5)

  return (
    <div className="stack">
      <div className="dashboard-banner"><div><span className="eyebrow">{t('TỔNG QUAN HOẠT ĐỘNG')}</span><h3>{t('Tập trung vào điều quan trọng.')}</h3><p>{t('Một góc nhìn rõ ràng về phòng tập của bạn, mỗi ngày.')}</p></div><button className="btn" onClick={() => goTo('classes')}>{t('Quản lý lịch tập')}<Icon name="arrow" size={17} /></button></div>
      <div className="stats">
        <div className="stat"><div className="stat-icon"><Icon name="users" /></div><span>{t("Hội viên")}</span><strong>{members.length}</strong><em>{activeMembers.length}{t(" đang hoạt động")}</em></div>
        <div className="stat"><div className="stat-icon"><Icon name="trend" /></div><span>{t("Doanh thu")}</span><strong>{formatMoney(revenue)}</strong><em>{payments.length}{t(" giao dịch")}</em></div>
        <div className="stat"><div className="stat-icon"><Icon name="calendar" /></div><span>{t("Lớp học")}</span><strong>{classes.length}</strong><em>{rooms.length}{t(" phòng tập")}</em></div>
        <div className="stat"><div className="stat-icon"><Icon name="dumbbell" /></div><span>{t("Huấn luyện viên")}</span><strong>{coaches.length}</strong><em>{packages.filter((p) => p.active).length}{t(" gói đang bán")}</em></div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>{t("Thao tác nhanh")}</h3>
        </div>
        <div className="quick">
          <button className="btn" onClick={() => goTo('packages')}>{t("+ Tạo gói thành viên")}</button>
          <button className="btn" onClick={() => goTo('rooms')}>{t("+ Thêm phòng tập")}</button>
          <button className="btn btn-primary" onClick={() => goTo('classes')}>{t("+ Tạo lớp & phân công Coach")}</button>
        </div>
      </div>

      <div className="dashboard-grid"><div className="card">
        <div className="card-head">
          <h3>{t("Giao dịch gần đây")}</h3>
        </div>
        <div className="table-scroll"><table className="table">
          <thead>
            <tr><th>{t("Số HĐ")}</th><th>{t("Hội viên")}</th><th>{t("Gói")}</th><th>{t("Kênh")}</th><th>{t("Ngày")}</th><th className="right">{t("Số tiền")}</th></tr>
          </thead>
          <tbody>
            {recent.length === 0 && <tr><td colSpan="6" className="center muted">{t('Chưa có giao dịch để hiển thị.')}</td></tr>}
            {recent.map((p) => (
              <tr key={p.id}>
                <td>{p.invoiceNo}</td>
                <td>{users.find((u) => u.id === p.userId)?.name}</td>
                <td>{packages.find((x) => x.id === p.packageId)?.name}</td>
                <td>{t(p.channel)}</td>
                <td>{formatDate(p.date)}</td>
                <td className="right">{formatMoney(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      <div className="card"><div className="card-head"><h3>{t('Tình trạng hội viên')}</h3></div><div className="health-count">{members.length ? Math.round(activeMembers.length / members.length * 100) : 0}%</div><p className="health-label">{t('Có gói còn hiệu lực')}</p><div className="health-bar" aria-hidden="true"><span style={{ width: `${members.length ? activeMembers.length / members.length * 100 : 0}%` }} /></div><div className="health-legend"><span className="live-dot" />{t('Có gói còn hiệu lực')}<strong>{activeMembers.length}</strong></div><div className="health-legend"><span className="live-dot inactive-dot" />{t('Chưa có gói hoặc đã hết hạn')}<strong>{members.length - activeMembers.length}</strong></div></div></div>
    </div>
  )
}
