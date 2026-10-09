import { useState } from 'react'
import { ErrorBox, MockBadge } from '../../components/Status'
import { classApi, coachApi, packageApi, paymentApi, roomApi, scheduleApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { formatDate, formatMoney, getMembershipStatus, todayISO } from '../../store/utils'

export default function Dashboard({ goTo }) {
  const { members, memberships } = useStore()
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const { data, error, reload } = useApi(() =>
    Promise.all([classApi.list(), roomApi.list(), coachApi.list(), packageApi.list(), scheduleApi.list(), paymentApi.list()]).then(
      ([classes, rooms, coaches, packages, schedules, payments]) => ({ classes, rooms, coaches, packages, schedules, payments }),
    ),
  )
  const activeMembers = members.filter((m) => getMembershipStatus(m.email, memberships).status === 'active')
  const periodPayments = (data?.payments || []).filter((payment) => {
    if (payment.status !== 'COMPLETED') return false
    return period === 'all' || (payment.completedAt || payment.createdAt || '').slice(0, 7) === period
  })
  const revenue = periodPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const recent = [...periodPayments].sort((a, b) => (b.completedAt || b.createdAt).localeCompare(a.completedAt || a.createdAt)).slice(0, 5)
  const upcoming = (data?.schedules || []).filter((s) => s.startTime.slice(0, 10) >= todayISO()).length
  const v = (x) => (data ? x : '…')
  const monthOptions = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - index)
    const value = date.toISOString().slice(0, 7)
    return { value, label: date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) }
  })

  return (
    <div className="stack">
      <ErrorBox error={error} onRetry={reload} />
      <div className="stats">
        <div className="stat"><span>Lớp học</span><strong>{v(data?.classes.length)}</strong><em>{v(upcoming)} buổi sắp tới</em></div>
        <div className="stat"><span>Huấn luyện viên</span><strong>{v(data?.coaches.length)}</strong><em>{v(data?.rooms.length)} phòng tập</em></div>
        <div className="stat"><span>Hội viên <MockBadge /></span><strong>{members.length}</strong><em>{activeMembers.length} đang hoạt động</em></div>
        <div className="stat">
          <span>Thực thu theo kỳ</span>
          <strong>{data ? formatMoney(revenue) : '…'}</strong>
          <em>{periodPayments.length} giao dịch đã thanh toán</em>
          <label className="small muted" htmlFor="revenue-period">Kỳ báo cáo</label>
          <select id="revenue-period" value={period} onChange={(event) => setPeriod(event.target.value)}>
            {monthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            <option value="all">Toàn thời gian</option>
          </select>
        </div>
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
          <h3>Khoản thu đã xác nhận gần đây</h3>
        </div>
        {recent.length === 0 ? (
          <p className="muted">{data ? 'Chưa có khoản thu trong kỳ.' : 'Đang tải giao dịch...'}</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Số HĐ</th><th>Hội viên</th><th>Gói</th><th>Trạng thái</th><th>Ngày thu</th><th className="right">Số tiền</th></tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.paymentId}>
                  <td>{p.invoiceCode}</td>
                  <td>{p.memberName || `Hội viên #${p.memberId}`}</td>
                  <td>{p.packageName}</td>
                  <td>Đã thanh toán</td>
                  <td>{formatDate(p.completedAt || p.createdAt)}</td>
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
