import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus } from '../../store/utils'

export default function Dashboard({ goTo }) {
  const { users, classes, packages, rooms, payments, memberships } = useStore()
  const members = users.filter((u) => u.role === 'member')
  const coaches = users.filter((u) => u.role === 'coach')
  const activeMembers = members.filter((m) => getMembershipStatus(m.id, memberships).status === 'active')
  const revenue = payments.reduce((s, p) => s + p.amount, 0)
  const recent = [...payments].reverse().slice(0, 5)

  return (
    <div className="stack">
      <div className="stats">
        <div className="stat"><span>Hội viên</span><strong>{members.length}</strong><em>{activeMembers.length} đang hoạt động</em></div>
        <div className="stat"><span>Doanh thu</span><strong>{formatMoney(revenue)}</strong><em>{payments.length} giao dịch</em></div>
        <div className="stat"><span>Lớp học</span><strong>{classes.length}</strong><em>{rooms.length} phòng tập</em></div>
        <div className="stat"><span>Huấn luyện viên</span><strong>{coaches.length}</strong><em>{packages.filter((p) => p.active).length} gói đang bán</em></div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Thao tác nhanh</h3>
        </div>
        <div className="quick">
          <button className="btn" onClick={() => goTo('packages')}>+ Tạo gói thành viên</button>
          <button className="btn" onClick={() => goTo('rooms')}>+ Thêm phòng tập</button>
          <button className="btn btn-primary" onClick={() => goTo('classes')}>+ Tạo lớp & phân công Coach</button>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Giao dịch gần đây</h3>
        </div>
        <table className="table">
          <thead>
            <tr><th>Số HĐ</th><th>Hội viên</th><th>Gói</th><th>Kênh</th><th>Ngày</th><th className="right">Số tiền</th></tr>
          </thead>
          <tbody>
            {recent.map((p) => (
              <tr key={p.id}>
                <td>{p.invoiceNo}</td>
                <td>{users.find((u) => u.id === p.userId)?.name}</td>
                <td>{packages.find((x) => x.id === p.packageId)?.name}</td>
                <td>{p.channel}</td>
                <td>{formatDate(p.date)}</td>
                <td className="right">{formatMoney(p.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
