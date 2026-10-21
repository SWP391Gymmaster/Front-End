import { useState } from 'react'
import { ErrorBox, MockBadge, Loading } from '../../components/Status'
import { classApi, coachApi, packageApi, paymentApi, roomApi, scheduleApi } from '../../api/services'
import BarChart from '../../components/BarChart'
import { Delta, ShareList } from '../../components/Revenue'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import {
  addDays,
  addMonths,
  completedPayments,
  formatDate,
  formatDateTime,
  formatMoney,
  getMembershipStatus,
  groupSum,
  nowVN,
  PAYMENT_METHOD,
  sumAmount,
  todayISO,
  vnDate,
  vnMonth,
} from '../../store/utils'

export default function Dashboard({ goTo }) {
  const { members, memberships } = useStore()
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))

  const { data, error, reload, loading } = useApi(() =>
    Promise.all([
      classApi.list(),
      roomApi.list(),
      coachApi.list(),
      packageApi.list(),
      scheduleApi.list(),
      paymentApi.list(),
    ]).then(([classes, rooms, coaches, packages, schedules, payments]) => ({
      classes,
      rooms,
      coaches,
      packages,
      schedules,
      payments,
    })),
  )

  if (loading && !data) return <Loading />

  const payments = data?.payments || []
  const done = completedPayments(payments)
  const activeMembers = members.filter((m) => getMembershipStatus(m.email, memberships).status === 'active')

  // Xử lý kỳ báo cáo (revenue theo period)
  const periodPayments = payments.filter((payment) => {
    if (payment.status !== 'COMPLETED') return false
    return period === 'all' || (payment.completedAt || payment.createdAt || '').slice(0, 7) === period
  })
  const revenue = periodPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  const now = nowVN()
  const today = now.slice(0, 10)
  const month = now.slice(0, 7)
  const prevMonth = addMonths(month, -1)

  const todayRevenue = sumAmount(done.filter((p) => vnDate(p.completedAt) === today))
  const monthList = done.filter((p) => vnMonth(p.completedAt) === month)
  const monthRevenue = sumAmount(monthList)
  const prevRevenue = sumAmount(done.filter((p) => vnMonth(p.completedAt) === prevMonth))
  const totalRevenue = sumAmount(done)
  const pending = payments.filter((p) => p.status === 'PENDING')
  const cancelled = payments.filter((p) => p.status === 'CANCELLED' || p.status === 'FAILED')
  const payingMembers = new Set(done.map((p) => p.memberId)).size

  const upcoming = (data?.schedules || []).filter((s) => s.startTime.slice(0, 10) >= todayISO()).length
  const v = (x) => (data ? x : '…')

  const monthOptions = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setMonth(date.getMonth() - index)
    const value = date.toISOString().slice(0, 7)
    return { value, label: date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) }
  })

  // Biểu đồ 30 ngày gần nhất
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29))
  const byDay = groupSum(done, (p) => vnDate(p.completedAt))
  const chart = days.map((d) => {
    const found = byDay.find((x) => x.key === d)
    return {
      key: d,
      label: formatDate(d).slice(0, 5),
      value: found?.amount || 0,
      title: `${formatDate(d)}: ${formatMoney(found?.amount || 0)} (${found?.count || 0} giao dịch)`,
    }
  })
  const last30 = sumAmount(done.filter((p) => vnDate(p.completedAt) >= days[0]))

  const byPackage = groupSum(monthList, (p) => p.packageName)
  const byMethod = groupSum(monthList, (p) => p.paymentMethod)
  const recent = [...done].sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt))).slice(0, 6)

  return (
    <div className="stack">
      <ErrorBox error={error} onRetry={reload} />
      <div className="alert alert-info small">
        Doanh thu chỉ tính các giao dịch <strong>đã thu tiền</strong>. Đơn đang chờ thanh toán hoặc đã hủy không được cộng.
      </div>

      <div className="stats">
        <div className="stat">
          <span>Lớp học</span>
          <strong>{v(data?.classes.length)}</strong>
          <em>{v(upcoming)} buổi sắp tới</em>
        </div>
        <div className="stat">
          <span>Huấn luyện viên</span>
          <strong>{v(data?.coaches.length)}</strong>
          <em>{v(data?.rooms.length)} phòng tập</em>
        </div>
        <div className="stat">
          <span>Hội viên <MockBadge /></span>
          <strong>{members.length}</strong>
          <em>{activeMembers.length} đang hoạt động</em>
        </div>
        <div className="stat">
          <span>Thực thu theo kỳ</span>
          <strong>{data ? formatMoney(revenue) : '…'}</strong>
          <em>{periodPayments.length} giao dịch đã thanh toán</em>
          <div style={{ marginTop: '6px' }}>
            <label className="small muted" htmlFor="revenue-period" style={{ display: 'block', marginBottom: '2px' }}>Kỳ báo cáo</label>
            <select id="revenue-period" value={period} onChange={(event) => setPeriod(event.target.value)} style={{ width: '100%' }}>
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
              <option value="all">Toàn thời gian</option>
            </select>
          </div>
        </div>
        <div className="stat">
          <span>Thực thu hôm nay</span>
          <strong>{formatMoney(todayRevenue)}</strong>
          <em>{formatDate(today)}</em>
        </div>
        <div className="stat">
          <span>Thực thu tháng này</span>
          <strong>{formatMoney(monthRevenue)}</strong>
          <Delta cur={monthRevenue} prev={prevRevenue} />
        </div>
        <div className="stat">
          <span>Tổng thực thu</span>
          <strong>{formatMoney(totalRevenue)}</strong>
          <em>{done.length} giao dịch · {payingMembers} hội viên</em>
        </div>
        <div className="stat stat-warn">
          <span>Chờ thu (chưa tính)</span>
          <strong>{formatMoney(sumAmount(pending))}</strong>
          <em className="muted">{pending.length} đơn chờ · {cancelled.length} đã hủy</em>
        </div>
      </div>

      <div className="card">
        <div className="card-head row-between">
          <h3>Doanh thu 30 ngày gần nhất</h3>
          <span className="muted small">Tổng {formatMoney(last30)}</span>
        </div>
        <BarChart data={chart} labelEvery={5} highlightKey={today} emptyText="Chưa có khoản thu nào trong 30 ngày qua" />
      </div>

      <div className="two-col even">
        <div className="card">
          <div className="card-head"><h3>Theo gói tập · tháng này</h3></div>
          <ShareList items={byPackage} total={monthRevenue} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Theo hình thức · tháng này</h3></div>
          <ShareList items={byMethod} total={monthRevenue} labelOf={(k) => PAYMENT_METHOD[k] || k} />
        </div>
      </div>

      <div className="card">
        <div className="card-head row-between">
          <h3>Khoản thu gần đây</h3>
          <button className="btn btn-sm" onClick={() => goTo('reports')}>Xem báo cáo tháng →</button>
        </div>
        {recent.length === 0 ? (
          <p className="muted">Chưa có khoản thu nào.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Mã hóa đơn</th>
                <th>Hội viên</th>
                <th>Gói</th>
                <th>Hình thức</th>
                <th>Thời điểm thu</th>
                <th className="right">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.paymentId}>
                  <td className="mono">{p.invoiceCode}</td>
                  <td>{p.memberName || `Hội viên #${p.memberId}`}</td>
                  <td>{p.packageName}</td>
                  <td>{PAYMENT_METHOD[p.paymentMethod] || p.paymentMethod}</td>
                  <td>{formatDateTime(p.completedAt || p.createdAt)}</td>
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