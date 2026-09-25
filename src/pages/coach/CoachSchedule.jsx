import { DAYS } from '../../data/seed'
import { useStore } from '../../store/context'

export default function CoachSchedule() {
  const { classes, rooms, currentUser } = useStore()
  const mine = classes.filter((c) => c.coachId === currentUser.id)

  return (
    <div className="stack">
      <div className="alert alert-info">Bạn đang phụ trách <strong>{mine.length}</strong> lớp do Center Manager phân công.</div>
      <div className="card">
        <div className="timetable">
          {DAYS.map((d) => {
            const items = mine.filter((c) => c.days.includes(d)).sort((a, b) => a.start.localeCompare(b.start))
            return (
              <div key={d} className="tt-col">
                <div className="tt-day">{d === 'CN' ? 'Chủ nhật' : 'Thứ ' + d.slice(1)}</div>
                {items.map((c) => (
                  <div key={c.id} className={'tt-item subj-' + c.subject.toLowerCase()}>
                    <strong>{c.start}–{c.end}</strong>
                    <span>{c.name}</span>
                    <em>{rooms.find((r) => r.id === c.roomId)?.name}</em>
                  </div>
                ))}
                {items.length === 0 && <div className="tt-empty">Nghỉ</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
