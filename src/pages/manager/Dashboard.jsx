import { ErrorBox, MockBadge } from '../../components/Status'
import { classApi, coachApi, packageApi, roomApi, scheduleApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus, todayISO } from '../../store/utils'

export default function Dashboard({ goTo }) {
  const { members, memberships, payments } = useStore()
  const { data, error, reload } = useApi(() =>
    Promise.all([classApi.list(), roomApi.list(), coachApi.list(), packageApi.list(), scheduleApi.list()]).then(
      ([classes, rooms, coaches, packages, schedules]) => ({ classes, rooms, coaches, packages, schedules }),
    ),
  )
  const activeMembers = members.filter((m) => getMembershipStatus(m.email, memberships).status === 'active')
  const revenue = payments.reduce((s, p) => s + p.amount, 0)
  const recent = [...payments].reverse().slice(0, 5)
  const upcoming = (data?.schedules || []).filter((s) => s.startTime.slice(0, 10) >= todayISO()).length
  const v = (x) => (data ? x : '…')

  return (
    <div className="stack">
      <ErrorBox error={error} onRetry={reload} />
      <div className="stats">
        <div className="stat"><span>Lớp học</span><strong>{v(data?.classes.length)}</strong><em>{v(upcoming)} buổi sắp tới</em></div>
        <div className="stat"><span>Huấn luyện viên</span><strong>{v(data?.coaches.length)}</strong><em>{v(data?.rooms.length)} phòng tập</em></div>
        <div className="stat"><span>Hội viên <MockBadge /></span><strong>{members.length}</strong><em>{activeMembers.length} đang hoạt động</em></div>
        <div className="stat"><span>Doanh thu <MockBadge /></span><strong>{formatMoney(revenue)}</strong><em>{payments.length} giao dịch · {v(data?.packages.filter((p) => p.active).length)} gói đang bán</em></div>
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
          <h3>Giao dịch gần đây <MockBadge /></h3>
        </div>
        {recent.length === 0 ? (
          <p className="muted">Chưa có giao dịch.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Số HĐ</th><th>Hội viên</th><th>Gói</th><th>Kênh</th><th>Ngày</th><th className="right">Số tiền</th></tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.id}>
                  <td>{p.invoiceNo}</td>
                  <td>{members.find((m) => m.email === p.email)?.fullName || p.email}</td>
                  <td>{p.packageName}</td>
                  <td>{p.channel}</td>
                  <td>{formatDate(p.date)}</td>
                  <td className="right">{formatMoney(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
