import { useStore } from '../../store/context'
import EntityManager from '../../components/EntityManager'
import { ROOM_TYPES, roomTypeLabel, validateRoom } from '../../validation/roomRules'

export default function Rooms() {
  const { rooms, saveRoom, deleteRoom, api } = useStore()
  return <EntityManager title="Phòng tập" createLabel="Thêm phòng tập" rows={rooms} initial={{ roomCode: '', name: '', capacity: 20, type: 'GYM' }} load={api.rooms.get} save={saveRoom} remove={deleteRoom}
    validate={form => validateRoom(form).join(' ')}
    fields={[
      { key: 'roomCode', label: 'Mã phòng (VD: ROOM-GYM-A)', required: true },
      { key: 'name', label: 'Tên phòng', required: true },
      { key: 'type', label: 'Loại phòng', required: true, options: ROOM_TYPES },
      { key: 'capacity', label: 'Sức chứa (người)', type: 'number', min: 1, step: 1, required: true },
    ]}
    columns={[
      { key: 'roomCode', label: 'Mã phòng', render: r => r.roomCode || '—' },
      { key: 'name', label: 'Tên phòng' },
      { key: 'type', label: 'Loại phòng', render: r => roomTypeLabel(r.type) },
      { key: 'capacity', label: 'Sức chứa' },
      { key: 'classCount', label: 'Số lớp đang dùng', render: r => r.classCount ?? '—' },
    ]} />
}