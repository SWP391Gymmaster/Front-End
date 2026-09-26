import { useState } from 'react'
import { addDays, dayLabel, DAYS, formatDate, formatTime, mondayOf, todayISO } from '../store/utils'

export default function WeekTimetable({ items, emptyText = 'Trống' }) {
  const [monday, setMonday] = useState(() => mondayOf(todayISO()))
  const sunday = addDays(monday, 6)
  const today = todayISO()

  return (
    <div className="stack-sm">
      <div className="week-nav">
        <button className="btn btn-sm" onClick={() => setMonday(addDays(monday, -7))}>← Tuần trước</button>
        <strong>{formatDate(monday)} – {formatDate(sunday)}</strong>
        <button className="btn btn-sm" onClick={() => setMonday(addDays(monday, 7))}>Tuần sau →</button>
      </div>
      <div className="timetable">
        {DAYS.map((d, i) => {
          const date = addDays(monday, i)
          const dayItems = items
            .filter((it) => it.startTime.slice(0, 10) === date)
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
          return (
            <div key={d} className="tt-col">
              <div className={'tt-day' + (date === today ? ' today' : '')}>
                {dayLabel(d)}
                <span>{formatDate(date).slice(0, 5)}</span>
              </div>
              {dayItems.map((it) => (
                <div key={it.id} className={'tt-item subj-' + (it.subject || 'gym').toLowerCase()}>
                  <strong>{formatTime(it.startTime)}–{formatTime(it.endTime)}</strong>
                  <span>{it.title}</span>
                  {it.lines.map((l, k) => <em key={k}>{l}</em>)}
                </div>
              ))}
              {dayItems.length === 0 && <div className="tt-empty">{emptyText}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
