// Dữ liệu mẫu để demo (chưa kết nối Back-End)
// Mật khẩu mặc định của mọi tài khoản demo: 123456

export const ROLES = {
  manager: 'Center Manager',
  receptionist: 'Receptionist',
  coach: 'Coach',
  member: 'Member',
}

export const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export const SUBJECTS = ['Gym', 'Yoga', 'Boxing', 'Cardio', 'Zumba', 'Pilates']

import { addDays, todayISO } from '../store/utils'

const today = todayISO()

export const seedData = {
  users: [
    { id: 'u1', role: 'manager', name: 'Trần Quốc Bảo', email: 'manager@gym.vn', password: '123456', phone: '0901000001' },
    { id: 'u2', role: 'receptionist', name: 'Lê Thu Hà', email: 'letan@gym.vn', password: '123456', phone: '0901000002' },
    { id: 'u3', role: 'coach', name: 'Nguyễn Văn Minh', email: 'coach@gym.vn', password: '123456', phone: '0901000003', specialty: 'Gym, Boxing' },
    { id: 'u4', role: 'coach', name: 'Phạm Ngọc Lan', email: 'lan@gym.vn', password: '123456', phone: '0901000004', specialty: 'Yoga, Pilates' },
    { id: 'u5', role: 'coach', name: 'Đỗ Hoàng Nam', email: 'nam@gym.vn', password: '123456', phone: '0901000005', specialty: 'Cardio, Zumba' },
    { id: 'u6', role: 'member', name: 'Võ Thị Mai', email: 'member@gym.vn', password: '123456', phone: '0912345678', gender: 'Nữ', goal: 'Giảm cân' },
    { id: 'u7', role: 'member', name: 'Hoàng Đức Anh', email: 'anh@gym.vn', password: '123456', phone: '0987654321', gender: 'Nam', goal: 'Tăng cơ' },
  ],
  packages: [
    { id: 'p1', name: 'Gói 1 tháng', price: 500000, days: 30, description: 'Tập không giới hạn khu Gym', active: true },
    { id: 'p2', name: 'Gói 3 tháng', price: 1350000, days: 90, description: 'Tiết kiệm 10%, tham gia 2 lớp nhóm', active: true },
    { id: 'p3', name: 'Gói 12 tháng', price: 4800000, days: 365, description: 'Tiết kiệm 20%, không giới hạn lớp nhóm', active: true },
  ],
  rooms: [
    { id: 'r1', name: 'Phòng Gym A', capacity: 40 },
    { id: 'r2', name: 'Phòng Yoga B', capacity: 20 },
    { id: 'r3', name: 'Phòng Boxing C', capacity: 15 },
  ],
  classes: [
    { id: 'c1', name: 'Yoga buổi sáng', subject: 'Yoga', roomId: 'r2', coachId: 'u4', days: ['T2', 'T4', 'T6'], start: '06:00', end: '07:00', capacity: 20 },
    { id: 'c2', name: 'Boxing cơ bản', subject: 'Boxing', roomId: 'r3', coachId: 'u3', days: ['T3', 'T5'], start: '18:00', end: '19:30', capacity: 15 },
  ],
  memberships: [
    { id: 'm1', userId: 'u7', packageId: 'p2', startDate: addDays(today, -20), endDate: addDays(today, 70) },
  ],
  payments: [
    { id: 'pay1', invoiceNo: 'HD0001', userId: 'u7', packageId: 'p2', amount: 1350000, method: 'Tiền mặt', date: addDays(today, -20), channel: 'Tại quầy', staffId: 'u2' },
  ],
}
