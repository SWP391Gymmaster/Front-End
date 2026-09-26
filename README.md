# Gym Master – Front-End

Front-End cho dự án SWP391 Gym Master.

## Chạy ứng dụng

```sh
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Các tài khoản demo có sẵn trên trang đăng nhập; mật khẩu `123456`.

## Giao diện

- Giao diện lấy cảm hứng từ [GymMaster](https://gymmaster.vn/): tông xanh, bố cục quản lý thống nhất, thẻ thống kê và điều hướng theo vai trò.
- Nút VI / EN và sáng / tối ở trang đăng nhập, đăng ký và thanh công cụ. Lựa chọn được lưu trong trình duyệt; lần đầu dùng giao diện theo cài đặt hệ điều hành.
- Nội dung giao diện, thông báo, biểu mẫu và hóa đơn hỗ trợ hai ngôn ngữ. Tên người, tên gói/lớp và nội dung do người dùng nhập giữ nguyên.
- Menu thu gọn trên điện thoại, bảng cuộn ngang, biểu mẫu và lịch tự sắp xếp theo kích thước màn hình.
- Bản dịch ở `src/preferences/translations.js`; trạng thái giao diện ở `src/preferences/PreferencesProvider.jsx`.

Ứng dụng hiện sử dụng dữ liệu demo trong localStorage, chưa kết nối Back-End. Thanh toán là mô phỏng.

## Kiểm tra

```sh
npm run lint
npm test
npm run build
```

Kiểm tra thủ công: đổi VI/EN và sáng/tối rồi tải lại trang; đăng nhập từng vai trò; mở/đóng biểu mẫu bằng bàn phím; thử màn hình điện thoại; đổi ngôn ngữ khi đang chỉnh hồ sơ và xác nhận lựa chọn không đổi.

## Công nghệ
- React + Vite
- ESLint

## Quy tắc làm việc nhóm
- Luôn Pull trước khi code
- Commit với mô tả rõ ràng
- Không dùng push --force
