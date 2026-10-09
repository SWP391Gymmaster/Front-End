import BarChart from '../../components/BarChart'
import { Delta, ShareList } from '../../components/Revenue'
import { ErrorBox, Loading } from '../../components/Status'
import { paymentApi } from '../../api/services'
import useApi from '../../api/useApi'
import {
  addDays,
  addMonths,
  completedPayments,
  formatDate,
  formatDateTime,
  formatMoney,
  groupSum,
  nowVN,
  PAYMENT_METHOD,
  sumAmount,
  vnDate,
  vnMonth,
} from '../../store/utils'

export default function Dashboard({ goTo }) {
  const { data: payments, loading, error, reload } = useApi(() => paymentApi.list())

  if (loading && !payments) return <Loading />
  if (!payments) return <ErrorBox error={error} onRetry={reload} />

  const done = completedPayments(payments)
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

  // 30 ngày gần nhất (kể cả hôm nay)
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29))
  const byDay = groupSum(done, (p) => vnDate(p.completedAt))
  const chart = days.map((d) => {
    const v = byDay.find((x) => x.key === d)
    return {
      key: d,
      label: formatDate(d).slice(0, 5),
      value: v?.amount || 0,
      title: `${formatDate(d)}: ${formatMoney(v?.amount || 0)} (${v?.count || 0} giao dịch)`,
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
        <div className="stat"><span>Thực thu hôm nay</span><strong>{formatMoney(todayRevenue)}</strong><em>{formatDate(today)}</em></div>
        <div className="stat"><span>Thực thu tháng này</span><strong>{formatMoney(monthRevenue)}</strong><Delta cur={monthRevenue} prev={prevRevenue} /></div>
        <div className="stat"><span>Tổng thực thu</span><strong>{formatMoney(totalRevenue)}</strong><em>{done.length} giao dịch · {payingMembers} hội viên</em></div>
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
            <thead><tr><th>Mã hóa đơn</th><th>Hội viên</th><th>Gói</th><th>Hình thức</th><th>Thời điểm thu</th><th className="right">Số tiền</th></tr></thead>
            <tbody>
              {recent.map((p) => (
                <tr key={p.paymentId}>
                  <td className="mono">{p.invoiceCode}</td>
                  <td>{p.memberName}</td>
                  <td>{p.packageName}</td>
                  <td>{PAYMENT_METHOD[p.paymentMethod] || p.paymentMethod}</td>
                  <td>{formatDateTime(p.completedAt)}</td>
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
