import { useStore } from '../../store/context'
import EntityManager from '../../components/EntityManager'

export default function Rooms() {
  const { rooms, schedules, saveRoom, deleteRoom, api } = useStore()
  return <EntityManager title="Phòng tập" createLabel="Thêm phòng tập" rows={rooms} initial={{ name: '', capacity: 20 }} load={api.rooms.get} save={saveRoom} remove={deleteRoom}
    fields={[{ key: 'name', label: 'Tên phòng', required: true }, { key: 'capacity', label: 'Sức chứa (người)', type: 'number', min: 1, step: 1, required: true }]}
    columns={[{ key: 'name', label: 'Tên phòng' }, { key: 'capacity', label: 'Sức chứa' }, { key: 'sessions', label: 'Số buổi học', render: r => schedules.filter(s => s.roomId === r.id).length }]} />
}
