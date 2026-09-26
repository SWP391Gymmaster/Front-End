import { ErrorBox, Loading } from '../../components/Status'
import WeekTimetable from '../../components/WeekTimetable'
import { classApi, roomApi, scheduleApi } from '../../api/services'
import useApi from '../../api/useApi'
import { useStore } from '../../store/context'
import { todayISO } from '../../store/utils'

export default function CoachSchedule() {
  const { session } = useStore()
  const { data, loading, error, reload } = useApi(
    () =>
      Promise.all([scheduleApi.byCoach(session.userId), classApi.list(), roomApi.list()]).then(
        ([schedules, classes, rooms]) => ({ schedules, classes, rooms }),
      ),
    [session.userId],
  )

  const schedules = data?.schedules || []
  const myClasses = new Set(schedules.map((s) => s.classId))
  const upcoming = schedules.filter((s) => s.startTime.slice(0, 10) >= todayISO()).length

  const items = schedules.map((s) => {
    const c = data.classes.find((x) => x.id === s.classId)
    return {
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: c?.subject,
      title: c?.name || 'Lớp #' + s.classId,
      lines: [data.rooms.find((r) => r.id === s.roomId)?.name || ''],
    }
  })

  return (
    <div className="stack">
      <ErrorBox error={error} onRetry={reload} />
      {data && (
        <div className="alert alert-info">
          Bạn đang phụ trách <strong>{myClasses.size}</strong> lớp do Center Manager phân công, còn <strong>{upcoming}</strong> buổi sắp tới.
        </div>
      )}
      <div className="card">
        {loading && !data ? <Loading /> : <WeekTimetable items={items} emptyText="Nghỉ" />}
      </div>
    </div>
  )
}
