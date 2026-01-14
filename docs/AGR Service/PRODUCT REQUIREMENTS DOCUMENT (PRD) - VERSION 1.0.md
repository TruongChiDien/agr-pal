# PRODUCT REQUIREMENTS DOCUMENT (PRD) - VERSION 1.0

**Project:**  Agricultural Service Management System (Agri-ERP)

**Status:**  Draft for Development

**Author:**  Senior Business Analyst

**Stack:**  NextJS, TailwindCSS, PostgreSQL (Prisma), ShadcnUI

---

## 1. Context (Bối cảnh dự án)

### 1.1. Mục tiêu (Project Goals)

Xây dựng hệ thống quản lý tập trung cho doanh nghiệp dịch vụ nông nghiệp nhằm thay thế phương pháp ghi chép sổ tay thủ công. Hệ thống tập trung vào việc quản lý lịch trình (Booking), thực thi (Job), tối ưu hóa việc tính lương nhân công và kiểm soát vòng đời máy móc.

### 1.2. Stakeholders

- **Admin (Chủ doanh nghiệp):**  Người sử dụng duy nhất, có toàn quyền quản lý, điều phối, và xem báo cáo tài chính.
- **Công nhân/Nhân công:**  Đối tượng thụ hưởng (nhận lương), thông tin được Admin quản lý.
- **Khách hàng:**  Đối tượng sử dụng dịch vụ, thông tin công nợ được Admin theo dõi.

### 1.3. Vấn đề cần giải quyết (Pain Points)

- **Công nợ phức tạp:**  Khách hàng trả nhiều lần, nhân công ứng lương liên tục dẫn đến khó kiểm soát số dư.
- **Sai lệch dữ liệu quá khứ:**  Giá dịch vụ và trọng số lương thay đổi theo thời gian làm sai lệch các tính toán lịch sử.
- **Thiếu trực quan:**  Không có cái nhìn tổng thể về hiệu suất từng máy (ROI) và tổng trạng thái doanh nghiệp.

---

## 2. User Flows (Luồng nghiệp vụ chính)

### 2.1. Thiết lập hệ thống (Initial Setup)

1. Admin tạo danh mục **Service ->**  Thiết lập **Price ->**  Tạo danh mục **Job Types** liên quan-\> Thiết lập **Base Salary** cho Job Type đó
2. Admin tạo danh mục **Machine Type**
3. Admin tạo danh sách **Máy móc**
4. Admin tạo danh sách **Nhân công** -> Add các **Job Type** mà nhân công có thể thực hiện -> Thiết lập weight salary cho **Job Type** đó

### 2.2. Luồng Booking & Thực thi (Service Execution)

```bash
graph TD
    A[Bắt đầu] --> B[Admin tạo Booking]
    B --> C[Chọn Khách hàng & Thửa đất]
    C --> D[Chọn Dịch vụ & Nhập diện tích/số lượng]
    D --> E[Hệ thống lấy Giá hiện tại & Tính Tổng tiền Booking]
    E --> F[Lưu Booking trạng thái Pending - Chốt doanh thu dự kiến]
    
    F --> G[Tạo 1 hoặc nhiều Jobs cho Booking]
    G --> H[Nhân công + Job Type (+ Máy móc)]
    H --> I[Nhập Số lượng thực tế nhân công làm cho Job]
    
    I --> J{Tính & Lưu Lương Job}
    J --> K[Lấy Base lương Job Type hiện tại]
    J --> L[Lấy Weight nhân công hiện tại]
    
    K & L --> M[Lưu: Lương Job = Số lượng * Base * Weight]
    M --> N[Lưu kèm vào Job: Giá trị Base & Weight đã dùng để đối chiếu]
    
    N --> O[Job chuyển trạng thái Completed]
    O --> P[Booking chuyển trạng thái Completed -> Sẵn sàng lập Bill]
```

### 2.3. Luồng Thanh toán khách hàng (Billing Flow)

```bash
sequenceDiagram
    participant A as Admin
    participant S as System
    participant B as Billing Module

    A->>S: Lọc danh sách Booking "Chưa lập Bill" của Khách X
    S-->>A: Hiển thị các Booking (B1, B2, B3...)
    A->>B: Chọn các Booking cần thanh toán -> Tạo Bill (Invoice)
    B->>B: Tính Tổng tiền Bill = Tổng tiền các Booking
    A->>B: Ghi nhận số tiền khách trả (Lần 1)
    alt Trả chưa đủ
        B->>B: Trạng thái Bill = "Partial" (Nợ lại)
    else Trả đủ
        B->>B: Trạng thái Bill = "Completed"
        B->>S: Đánh dấu B1, B2, B3 = "Paid" (Đã thanh toán)
    end
```

### 2.4. Luồng quyết toán lương (Payroll Flow)

```bash
sequenceDiagram
    participant A as Admin
    participant S as System
    participant P as Payroll Module

    A->>S: Lọc danh sách Job & Phiếu ứng tiền "Chưa quyết toán" của Nhân công Y
    S-->>A: Hiển thị Jobs (J1, J2...) & Advances (A1, A2...)
    A->>P: Tạo Bảng lương (Payroll Sheet)
    P->>P: Tính Thực nhận = Tổng Job - Tổng Ứng
    A->>P: Ghi nhận số tiền chi trả cho nhân công
    alt Trả chưa đủ
        P->>P: Trạng thái Bảng lương = "Debt" (Còn nợ lương)
    else Trả đủ
        P->>P: Trạng thái Bảng lương = "Completed"
        P->>S: Đánh dấu J1, J2 & A1, A2 = "Settled" (Đã quyết toán)
    end
```

‍

---

## 3. Functional Requirements (Yêu cầu chức năng)

[!IMPORTANT] **Quy tắc về tính toàn vẹn dữ liệu:**

1. Một **Booking/Job** chỉ được phép thuộc về ​**duy nhất một Bill/Payroll Sheet**.
2. Nếu một Bill bị xóa, trạng thái của các Booking bên trong phải quay về `Pending_Bill` để có thể chọn lại vào Bill khác.
3. Không được xoá Bill đã được thanh toán 1 phần (trạng thái `Unpaid`​). Chỉ được xoá Bill có trạng thái `New`
4. **Số dư nợ (Debt):**  Không tính toán real-time từ toàn bộ lịch sử mà nên tính theo Balance của từng Bill/Payroll để tối ưu hiệu năng NextJS.

### 3.1. Module Quản lý Dịch vụ & Giá (Service & Pricing)

**User Story 1.1:**  *As an Admin, I want to manage services and pricing history.*

- **AC1:**  Cho phép thêm mới Service (Tên, Mô tả, Đơn vị tính, Giá).
- **AC2:**  Mỗi Service có một danh sách `Price_History`. Giá hiện tại được dùng để gợi ý khi tạo Booking.
- **AC3:**  Cho phép tạo các `Job_Type` thuộc một Service (Ví dụ: Service "Cắt lúa" có Job Type "Lái máy" và "Đóng bao").

### 3.2. Module Khách hàng & Thửa đất (Customer & Land)

**User Story 2.1:**  *As an Admin, I want to store customer information and GPS land locations.*

- **AC1:**  Quản lý profile khách hàng (Tên, SĐT, Địa chỉ).
- **AC2:**  Một khách hàng có thể có nhiều thửa đất (Land).
- **AC3:**  Mỗi Land cần lưu tọa độ GPS (Đánh dấu trên bản đồ) và tên gọi riêng để phân biệt.

### 3.7. Module Quản lý Booking (Booking Management)

**User Story 7.1:**  *As an Admin, I want to manage bookings to track agricultural service requests.*

- **AC1: Khởi tạo:**  Cho phép chọn Khách hàng, chọn Thửa đất (Land) của khách hàng đó, và chọn Dịch vụ (Service).
- **AC2: Nhập liệu:**  Admin nhập Diện tích/Số lượng dự kiến làm việc.
- **AC3: Chốt giá:**  Hệ thống tự động điền đơn giá dịch vụ hiện hành và tính toán `Total_Amount`. Admin có thể điều chỉnh giá này bằng tay trước khi lưu nếu có thỏa thuận riêng với khách.
- **AC4: Trạng thái Booking:**

  - ​`New`: Mới tạo, chưa thực hiện.
  - ​`In-Progress`: Đơn hàng đang được thực hiện.
  - ​`Blocked`: Đơn hàng tạm hoãn khi đang thực hiện.
  - ​`Completed`​: Đơn hàng hoàn thành -> Cập nhật tất cả `New`​ jobs và `In-Progress`​ jobs thành `Completed`
  - ​`Canceled`​: Đơn hàng bị hủy -> Cập nhật tất cả `New`​ jobs thành `Cancelled`
- **AC5: Trạng thái thanh toán:**

  - ​`Pending_Bill`: chưa được thêm vào bất kỳ bill nào
  - ​`Added_Bill`: đã thêm vào 1 bill nhưng bill đó chưa được thanh toán hoàn toàn
  - ​`Fully_Paid`: đã thêm vào 1 bill và bill đó đã được thanh toán hoàn toàn

### 3.3. Module Quản lý Hóa đơn & Công nợ Khách hàng (Billing & Debt)

**User Story 3.1:**  *As an Admin, I want to aggregate multiple bookings into a bill and track partial payments.*

- **AC1: Khởi tạo Bill:**  Cho phép Admin chọn nhiều Booking có trạng thái thanh toán `Pending_Bill`​ của cùng một khách hàng để gom vào một Bill -> Cập nhật trạng thái thanh toán của các booking thành `Added_Bill`
- **AC2: Tính toán giá trị Bill:**

  - $$
    Total\_Bill\_Amount = \sum Booking\_Amount
    $$
- **AC3: Ghi nhận thanh toán (Payment Entries):**  Một Bill có thể có nhiều đợt thanh toán. Mỗi đợt phải lưu: Ngày, Số tiền, Hình thức (Tiền mặt/Chuyển khoản).
- **AC4: Quản lý trạng thái Bill:**

  - ​`Open`​ **:**  Bill mới tạo, chưa thanh toán
  - ​`Partial_Paid`: thanh toán một phần.
  - ​`Completed`​ **:**  Khi $\sum Payments \ge Total\_Bill\_Amount$.
- **AC5: Cơ chế Đánh dấu (Flagging):**  Khi Bill chuyển sang `Completed`​, hệ thống tự động cập nhật trạng thái thanh toán tất cả Booking liên quan thành `Fully_Paid` để loại bỏ khỏi danh sách lập bill lần sau.
- **AC6: Theo dõi nợ cũ:**  Hiển thị tổng nợ còn lại của từng khách hàng dựa trên tất cả các Bill chưa `Completed`.

### 3.4. Module Quản lý Công việc (Job) & Snapshot Lương

**User Story 4.1:**  *As an Admin, I want to create Jobs and freeze worker wages at the time of creation.*

- **AC1:**  Mỗi Job liên kết với 01 Nhân công (và 1 máy móc nếu có - tuỳ loại job). Một Booking có thể bao gồm nhiều Job.
- **AC2 (Immediate Wage Freezing):**  Khi Admin nhập "Số lượng thực tế" và nhấn lưu Job:

  - Hệ thống lấy `Current_Base_Salary`​ (của Job Type) và `Current_Weight` (của nhân công).

    - Tính: $Wage = Qty * Base * Weight$.
- **AC3 (Audit Trail Storage):**  Bản ghi lương nhân công trong Job phải lưu đủ 4 trường: `applied_base`​, `applied_weight`​, `actual_qty`​, `final_wage` để đối chiếu sau này
- **AC4: Trạng thái job:**

  - ​`New`: Mới tạo, chưa thực hiện.
  - ​`In-Progress`: Job đang được thực hiện.
  - ​`Blocked`: Job tạm hoãn khi đang thực hiện.
  - ​`Completed`: Job hoàn thành
  - ​`Canceled`: Job bị hủy
- **AC5: Trạng thái thanh toán**

  - ​`Pending_Payroll`: chưa được thêm vào bất kỳ bảng lương nào
  - ​`Added_Payroll`: đã thêm vào 1 bảng lương nhưng bảng lương đó chưa được thanh toán hoàn toàn
  - ​`Fully_Paid`: đã thêm vào 1 bảng lương và bảng lương đó đã được thanh toán hoàn toàn

### 3.5. Module Nhân sự & Lương (HR & Payroll)

**User Story 5.1:**  *As an Admin, I want to create payroll sheets to settle jobs and advance payments for workers.*

- **AC1: Quản lý Phiếu ứng lương (Advance Payment):**  Chức năng tạo phiếu chi cho nhân công ứng trước tiền. Phiếu này ở trạng thái `Unprocessed` cho đến khi được đưa vào Bảng lương.
- **AC2: Khởi tạo Bảng lương (Payroll Sheet):**  Admin chọn các Job đã hoàn thành và các Phiếu ứng lương chưa quyết toán của một nhân công.
- **AC3: Công thức tính toán Snapshot:**

  - $$
    Total\_Earned = \sum Job\_Wages
    $$
  - $$
    Total\_Deduction = \sum Advance\_Payments
    $$
- $$
  Net\_Payable = Total\_Earned - Total\_Deduction
  $$
- **AC4: Ghi nhận chi trả lương:**  Cho phép trả lương làm nhiều đợt cho một Bảng lương.
- **AC5: Cơ chế Chốt sổ:**  Khi Bảng lương được đánh dấu `Completed` (Đã trả đủ tiền $Net\_Payable$):

  - Hệ thống chuyển trạng thái thanh toán tất cả Job liên quan thành `Fully_Paid`.
  - Chuyển trạng thái các Phiếu ứng lương liên quan thành `Processed`.
- **AC6: Truy vấn lịch sử:**  Cho phép xem lại các Bảng lương cũ để đối soát khi nhân công thắc mắc.
- **AC7: Trạng thái Bảng lương:**

  - ​`Open`​ **:**  Bảng lương mới tạo, chưa thanh toán
  - ​`Partial_Paid`: thanh toán một phần.
  - ​`Completed`​ **:**  Khi $\sum Payments \ge Total\_Payroll\_Amount$.

### 3.6. Module Quản lý Máy móc (Asset Management)

**User Story 6.1:**  *As an Admin, I want to track machine maintenance and ROI.*

- **AC1:**  Quản lý danh mục máy móc (Tên máy, Model, Ngày mua).
- **AC2:**  Ghi nhận lịch sử sửa chữa (Ngày, Chi phí, Nội dung sửa chữa).
- **AC3:**  Báo cáo ROI cơ bản: $Machine\_Profit = \sum Booking\_Revenue_{(related\_jobs)} - \sum Labor\_Costs - \sum Repair\_Costs$.

---

## 4. Non-Functional Requirements (Yêu cầu phi chức năng)

- **NFR1 - Hiệu năng:**  Sử dụng NextJS SSR cho trang Dashboard báo cáo và CSR cho các form nhập liệu để đảm bảo trải nghiệm mượt mà.
- **NFR2 - Tính nhất quán dữ liệu:**  Sử dụng Database Transaction khi tạo Job để đảm bảo dữ liệu Snapshot lương luôn chính xác.
- **NFR3 - UI/UX:**  Giao diện Desktop-first (NextJS + Tailwind)
- **NFR4 - Bảo mật:**  Xác thực qua Clerk hoặc NextAuth. Chỉ Admin mới có quyền truy cập hệ thống.
- **NFR5 - Khả năng mở rộng:**  Cấu trúc Schema phải sẵn sàng để thêm Module Kho (Nhiên liệu/Phụ tùng) ở Phase 2.

‍

---

## 5. Phân tích Logic Database (Data Schema Detail)

Dưới đây là cấu trúc bảng dự kiến cho hệ thống sử dụng PostgreSQL (Prisma).

### 5.1. Nhóm Danh mục (Masters)

- **Table** **​`Service`​**

  - ​`id`: Primary Key
  - ​`name`: Tên dịch vụ (Cày, Cắt lúa, Vận chuyển...)
  - ​`unit`: Đơn vị tính (mẫu, công, tấn, giờ...)
  - ​`current_price`: Giá hiện tại áp dụng cho khách hàng.
- **Table** **​`Job_Type`​**

  - ​`id`: Primary Key
  - ​`service_id`​: Foreign Key (`Service`)
  - ​`name`: Tên loại công việc (Lái máy cày, Đóng bao...)
  - ​`default_base_salary`: Mức lương cơ bản hiện tại cho loại việc này.
- **Table** **​`Worker`​**

  - ​`id`: Primary Key
  - ​`name`: Tên nhân công.
  - ​`phone`: Số điện thoại.
- **Table** **​`Worker_Weight`​** (Quản lý trọng số lương riêng biệt cho từng người theo loại việc)

  - ​`id`: Primary Key
  - ​`worker_id`​: Foreign Key (`Worker`)
  - ​`job_type_id`​: Foreign Key (`Job_Type`)
  - ​`weight`: Trọng số (mặc định 1.0).
- **Table** **​`Machine`​**

  - ​`id`: Primary Key
  - ​`name`: Tên/Biển số máy.
  - ​`type`: Loại máy.
  - ​`status`: Trạng thái (Sẵn sàng/Đang sửa/Đang làm).

### 5.2. Nhóm Vận hành (Operations)

- **Table** **​`Customer`​**

  - ​`id`: Primary Key
  - ​`name`​, `phone`​, `address`.
- **Table** **​`Land`​**

  - ​`id`: Primary Key
  - ​`customer_id`​: Foreign Key (`Customer`)
  - ​`name`: Tên thửa đất (ví dụ: Ruộng ông Bảy).
  - ​`gps_location`: Tọa độ hoặc link Google Maps.
- **Table** **​`Booking`​**

  - ​`id`: Primary Key
  - ​`customer_id`​, `land_id`​, `service_id`
  - ​`quantity`: Diện tích/Số lượng dự kiến.
  - ​`captured_price`: Giá dịch vụ tại thời điểm tạo booking.
  - ​`total_amount`​: Tổng tiền chốt cho khách (\$quantity \\times captured\\\_price\$).
  - ​`status`​: `Pending`​ | `In-Progress`​ | `Completed`​ | `Canceled`.
  - ​`bill_id`​: Foreign Key (`Bill`, optional).
- **Table** **​`Job`​**

  - ​`id`: Primary Key
  - ​`booking_id`​: Foreign Key (`Booking`)
  - ​`machine_id`​: Foreign Key (`Machine`)
  - ​`job_type_id`​: Foreign Key (`Job_Type`)
  - ​`status`​: `Pending`​ | `Completed`.
- **Table** **​`Job_Worker`​** (Lưu chi tiết lương chốt cho từng người trong Job)

  - ​`id`: Primary Key
  - ​`job_id`​: Foreign Key (`Job`)
  - ​`worker_id`​: Foreign Key (`Worker`)
  - ​`actual_qty`: Số lượng thực tế nhân công làm.
  - ​`applied_base`​: Mức lương cơ bản lấy từ `Job_Type` lúc tạo.
  - ​`applied_weight`​: Trọng số lấy từ `Worker_Weight` lúc tạo.
  - ​`final_pay`​: Lương thực nhận (\$actual\\\_qty \\times applied\\\_base \\times applied\\\_weight\$).
  - ​`settled_status`: Boolean (Đã quyết toán vào bảng lương chưa).
  - ​`payroll_id`​: Foreign Key (`Payroll_Sheet`, optional).

### 5.3. Nhóm Tài chính (Financials)

- **Table** **​`Bill`​**

  - ​`id`: Primary Key
  - ​`customer_id`​: Foreign Key (`Customer`)
  - ​`total_amount`: Tổng tiền các Booking gom vào.
  - ​`total_paid`: Số tiền khách đã trả (cộng dồn).
  - ​`status`​: `Open`​ | `Completed`.
- **Table** **​`Advance_Payment`​**

  - ​`id`: Primary Key
  - ​`worker_id`​: Foreign Key (`Worker`)
  - ​`amount`: Số tiền ứng.
  - ​`status`​: `Unprocessed`​ | `Processed`.
- **Table** **​`Payroll_Sheet`​**

  - ​`id`: Primary Key
  - ​`worker_id`​: Foreign Key (`Worker`)
  - ​`total_wage`: Tổng lương từ các Jobs.
  - ​`total_advance`: Tổng tiền ứng trừ vào.
  - ​`net_payable`​: Thực lĩnh (\$total\\\_wage - total\\\_advance\$).
  - ​`amount_paid`: Số tiền thực tế Admin đã chi trả cho bảng lương này.
  - ​`status`​: `Debt`​ | `Completed`.
