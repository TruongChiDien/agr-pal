# Brand Guidelines

## 1. Tinh thần thương hiệu (Brand Personality)

Hệ thống cần toát lên 3 đặc điểm cốt lõi:

- **Hiện đại & Công nghệ:**  Thay thế ghi chép thủ công.
- **Vững chãi:**  Liên quan đến nông nghiệp và máy móc cơ giới.
- **Minh bạch:**  Giải quyết bài toán công nợ và lương thưởng nhạy cảm.

---

## 2. Bảng màu (Color Palette)

Vì đây là phần mềm quản lý (ERP) cho nông nghiệp, màu sắc cần sự cân bằng giữa tính "đất" (nông nghiệp) và tính "số" (quản lý).

|**Loại màu**|**Mã màu (Hex)**|**Ý nghĩa ứng dụng**|
| --| ------------------| --------------------------------------------------------------------------------------|
|**Primary (Xanh nông nghiệp)**|​`#15803d`(Green 700)|Đại diện cho sự phát triển, mùa vụ. Dùng cho Button chính, Brand Sidebar.|
|**Secondary (Xanh Navy đậm)**|​`#1e293b`(Slate 800)|Đại diện cho sự chuyên nghiệp, tin cậy. Dùng cho Header, Navigation.|
|**Accent (Vàng đất)**|​`#eab308`(Yellow 500)|Nhắc nhở về máy móc, cơ giới hóa. Dùng cho các cảnh báo hoặc Highlight.|
|**Success (Thanh toán đủ)**|​`#22c55e`|Trạng thái`Completed`​,`Fully_Paid`.|
|**Destructive (Công nợ/Nợ)**|​`#ef4444`|Trạng thái`Debt`​,`Canceled`​,`Overdue`.|
|**Background**|​`#f8fafc`|Nền xám cực nhẹ để làm nổi bật các Card trắng bên trên.|

---

## 3. Phông chữ (Typography)

Cần ưu tiên các phông chữ Sans-serif hiện đại, có độ đọc (legibility) cao khi sử dụng trên thiết bị di động dưới ánh nắng.

- **Font family:**  **Inter** (Phông chữ mặc định cực tốt cho Dashboard) hoặc **Be Vietnam Pro** (Nếu muốn tối ưu hiển thị tiếng Việt hoàn hảo).
- **Cấu trúc:**

  - **Headings:**  Bold (700), màu Slate 900.
  - **Body text:**  Regular (400), màu Slate 700.
  - **Data/Numbers:**  Medium (500), dùng để làm nổi bật số tiền và diện tích.

---

## 4. Phong cách giao diện (UI Style)

Vì bạn sử dụng **ShadcnUI** và ​**TailwindCSS**​, tôi đề xuất phong cách ​ **"Clean Professional"** :

- **Bo góc (Border Radius):**  Sử dụng `rounded-xl` (12px) cho các Card và Button để tạo cảm giác hiện đại, thân thiện nhưng vẫn chắc chắn.
- **Đổ bóng (Shadow):**  Sử dụng `shadow-sm` cho các thẻ thông tin. Tránh đổ bóng quá dày gây rối mắt trên di động.
- **Card-based Layout:**  Mọi đối tượng (Booking, Job, Customer) nên nằm trong một Card riêng biệt với khoảng cách (padding) rộng rãi để dễ bấm.

---

## 5. Thiết kế cho đặc thù Nông nghiệp (UX Mobile-first)

Do Admin thường thao tác tại hiện trường:

- **Touch Targets:**  Các nút bấm (Ví dụ: "Chốt lương", "Tạo Bill") phải có chiều cao tối thiểu **44px** để dễ thao tác bằng ngón cái.
- **High Contrast:**  Sử dụng độ tương phản cao giữa chữ và nền để Admin thấy rõ dữ liệu khi đang ở ngoài đồng.
- **Status Badges:**  Sử dụng các Badge có màu sắc rõ rệt để phân biệt trạng thái:

  - ​`New`: Màu Xanh dương (Blue).
  - ​`In-Progress`: Màu Cam (Orange).
  - ​`Completed`: Màu Xanh lá (Green).
  - ​`Blocked`: Màu Xám (Gray).

---

## 6. Ví dụ về Component chủ đạo

> **Booking Card Example:**
>
> - **Tiêu đề:**  Tên khách hàng (Bold, Slate 900)
> - **Nội dung:**  Tên thửa đất + Loại dịch vụ (Slate 600)
> - **Giá trị:**  `1.200.000 đ` (Bold, Green 700)
> - **Badge:**  `Chưa thanh toán` (Nền đỏ nhạt, chữ đỏ đậm)
