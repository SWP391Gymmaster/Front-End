import { usePreferences } from '../../preferences/context'
import { DAYS } from '../../data/seed'
import { useStore } from '../../store/context'

export default function CoachSchedule() {
  const { t } = usePreferences()
  const { classes, rooms, currentUser } = useStore()
  const mine = classes.filter((c) => c.coachId === currentUser.id)

  return (
    <div className="stack">
      <div className="alert alert-info">{t("Bạn đang phụ trách ")}<strong>{mine.length}</strong>{t(" lớp do Center Manager phân công.")}</div>
      <div className="card">
        <div className="timetable">
          {DAYS.map((d) => {
            const items = mine.filter((c) => c.days.includes(d)).sort((a, b) => a.start.localeCompare(b.start))
            return (
              <div key={d} className="tt-col">
                <div className="tt-day">{t(d === 'CN' ? 'Chủ nhật' : 'Thứ ' + d.slice(1))}</div>
                {items.map((c) => (
                  <div key={c.id} className={'tt-item subj-' + c.subject.toLowerCase()}>
                    <strong>{t(c.start)}–{t(c.end)}</strong>
                    <span>{c.name}</span>
                    <em>{rooms.find((r) => r.id === c.roomId)?.name}</em>
                  </div>
                ))}
                {items.length === 0 && <div className="tt-empty">{t("Nghỉ")}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
