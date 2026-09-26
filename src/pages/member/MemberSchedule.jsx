import { ErrorBox, Loading } from '../../components/Status'
import WeekTimetable from '../../components/WeekTimetable'
import { classApi, coachApi, roomApi, scheduleApi } from '../../api/services'
import useApi from '../../api/useApi'

export default function MemberSchedule() {
  const { data, loading, error, reload } = useApi(() =>
    Promise.all([scheduleApi.list(), classApi.list(), roomApi.list(), coachApi.list()]).then(
      ([schedules, classes, rooms, coaches]) => ({ schedules, classes, rooms, coaches }),
    ),
  )

  const items = (data?.schedules || []).map((s) => {
    const c = data.classes.find((x) => x.id === s.classId)
    return {
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      subject: c?.subject,
      title: c?.name || 'Lớp #' + s.classId,
      lines: [
        'HLV ' + (data.coaches.find((x) => x.id === s.coachId)?.fullName || '—'),
        data.rooms.find((r) => r.id === s.roomId)?.name || '',
      ],
    }
  })

  return (
    <div className="card">
      <div className="card-head"><h3>Lịch các lớp đang mở</h3></div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : <WeekTimetable items={items} emptyText="Không có lớp" />}
    </div>
  )
}
