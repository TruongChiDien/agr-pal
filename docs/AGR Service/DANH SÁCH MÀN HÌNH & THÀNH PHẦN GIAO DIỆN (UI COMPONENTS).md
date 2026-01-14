# DANH SÁCH MÀN HÌNH & THÀNH PHẦN GIAO DIỆN (UI COMPONENTS)

## Nhóm Tổng quan (Dashboard)

### 1.1. Dashboard (Màn hình chính)

- **Mục tiêu:**  Cung cấp cái nhìn nhanh về tình hình kinh doanh và các lối tắt (Shortcut).
- **Thành phần chính:**

  - **Thẻ chỉ số (KPI Cards):**  Tổng doanh thu tháng, Tổng nợ khách hàng, Tổng nợ lương nhân công.
  - **Trạng thái máy móc:**  Biểu đồ tròn hoặc danh sách nhanh các máy đang "Đang làm" vs "Đang sửa".
  - **Lối tắt nhanh (Quick Actions):**  Nút nổi (FAB) hoặc Grid menu: "Tạo Booking", "Ghi nhận Ứng lương", "Tạo Hóa đơn".
  - **Lịch trình hôm nay:**  Danh sách các Booking/Job đang ở trạng thái `In-Progress`.

## 2. Nhóm Thiết lập (Master Data)

### 2.1. Quản lý Dịch vụ (Service Management)

- **Màn hình Danh sách:**  Table/List hiển thị Tên DV, Giá hiện tại, Đơn vị.
- **Màn hình Thêm/Sửa:**

  - Thông tin chung: Tên, Đơn vị tính, Giá đề xuất.
  - Danh sách Job Types (Master-Detail): Một khu vực cho phép Add/Remove các loại công việc con (Ví dụ: Lái máy, bốc vác) và nhập Base Salary cho từng loại.

### 2.2. Quản lý Khách hàng & Thửa đất

- **Màn hình Danh sách:**  Tên khách hàng, SĐT, Tổng dư nợ hiện tại.
- **Màn hình Chi tiết:**

  - Profile: Thông tin cá nhân.
  - Danh sách Thửa đất (Lands): List card hiển thị Tên ruộng, Nút "Xem GPS" (Mở Google Maps).
  - 3 tabs:

    - Danh sách đơn hàng mới/đang làm
    - Danh sách hoá đơn chưa thanh toán xong
    - Lịch sử trả tiền
- Màn hình Thêm/Sửa

### 2.3. Quản lý Nhân công (Worker Management)

- **Màn hình Danh sách:**  Tên, SĐT, Tổng nợ lương hiện tại.
- **Màn hình Chi tiết:**

  - Profile.
  - Cấu hình Trọng số (Wage Weight): Bảng danh sách các Job Type trong hệ thống, cho phép Admin nhập Weight (ví dụ: 1.2 cho thợ giỏi, 0.8 cho thợ phụ) cho nhân công này.

## 3. Nhóm Vận hành (Operations)

### 3.1. Quản lý Booking (Đặt hàng)

- **Màn hình Danh sách:**  Lọc theo trạng thái (New, In-Progress, Completed, Canceled).
- **Màn hình Tạo Booking:**

  - Dropdown: Chọn Khách hàng -\> Chọn Thửa đất (đã lọc theo khách).
  - Dropdown: Chọn Dịch vụ -\> Tự động load Price (cho phép ghi đè tay).
  - Input: Diện tích dự kiến.
- **Màn hình Chi tiết Booking:**

  - Thông tin tổng quan & Trạng thái thanh toán (Pending/Paid).
  - Khu vực Jobs: Danh sách các công việc đã/đang thực hiện cho booking này. Nút "Thêm Job".

### 3.2. Thực thi Công việc (Job Detail)

- **Màn hình Tạo/Sửa Job:**

  - Dropdown: Chọn Nhân công, Chọn Máy móc.
  - Input: Số lượng thực tế làm được.
  - **Phần Snapshot (ReadOnly):**  Hiển thị Giá base và Weight đang áp dụng để nhân công thấy được số tiền dự kiến nhận được.

## 4. Nhóm Tài chính (Financials)

### 4.1. Hóa đơn & Công nợ (Billing)

- **Màn hình Lập Bill:**

  - Chọn Khách hàng -\> Hiển thị danh sách checkbox các Booking `Pending_Bill`.
  - Nút "Gom đơn & Tạo Bill".
- **Màn hình Chi tiết Bill:**

  - Danh sách Booking bên trong Bill.
  - **Lịch sử Thanh toán:**  Danh sách các đợt khách trả tiền.
  - Nút "Ghi nhận thanh toán mới": Form nhập Ngày, Số tiền, Phương thức.

### 4.2. Quyết toán Lương (Payroll)

- **Màn hình Lập Bảng lương:**

  - Chọn Nhân công -\> Hiển thị 2 danh sách checkbox: Jobs chưa trả lương & Phiếu ứng chưa trừ.
- **Màn hình Chi tiết Bảng lương:**

  - Bảng tính: Tổng lương - Tổng ứng \= Thực nhận.
  - Nút "Chi trả lương": Ghi nhận các đợt Admin chuyển tiền cho nhân công.

## 5. Nhóm Tài sản (Assets)

### 5.1. Quản lý Máy móc

- **Màn hình Danh sách:**  Tên máy, Trạng thái (Sẵn sàng, Bảo trì).
- **Màn hình Chi tiết:**

  - Thông tin máy.
  - **Tab Nhật ký sửa chữa:**  Danh sách các lần chi tiền sửa máy.
  - **Tab Hiệu suất (ROI):**  Hiển thị doanh thu máy mang lại (tổng các job liên quan) trừ chi phí thợ và chi phí sửa.

‍
