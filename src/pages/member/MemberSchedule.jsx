import { usePreferences } from '../../preferences/context'
import { useStore } from '../../store/context'

export default function MemberSchedule() {
  const { t } = usePreferences()
  const { classes, rooms, users } = useStore()
  return (
    <div className="card">
      <div className="card-head"><h3>{t("Các lớp đang mở")}</h3></div>
      <div className="table-scroll"><table className="table">
        <thead><tr><th>{t("Lớp")}</th><th>{t("Bộ môn")}</th><th>{t("Huấn luyện viên")}</th><th>{t("Phòng")}</th><th>{t("Lịch")}</th></tr></thead>
        <tbody>
          {classes.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.name}</strong></td>
              <td>{t(c.subject)}</td>
              <td>{users.find((u) => u.id === c.coachId)?.name}</td>
              <td>{rooms.find((r) => r.id === c.roomId)?.name}</td>
              <td>{t(c.days.join(', '))} · {t(c.start)}–{t(c.end)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </div>
  )
}
