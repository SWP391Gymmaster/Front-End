import { useStore } from '../../store/context'

export default function MemberSchedule() {
  const { classes, rooms, users } = useStore()
  return (
    <div className="card">
      <div className="card-head"><h3>Các lớp đang mở</h3></div>
      <table className="table">
        <thead><tr><th>Lớp</th><th>Bộ môn</th><th>Huấn luyện viên</th><th>Phòng</th><th>Lịch</th></tr></thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.name}</strong></td>
              <td>{c.subject}</td>
              <td>{users.find((u) => u.id === c.coachId)?.name}</td>
              <td>{rooms.find((r) => r.id === c.roomId)?.name}</td>
              <td>{c.days.join(', ')} · {c.start}–{c.end}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
