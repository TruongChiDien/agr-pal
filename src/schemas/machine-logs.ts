import { z } from 'zod'

export const createMaintenanceLogSchema = z.object({
  machine_id: z.string().min(1, 'Máy không hợp lệ'),
  category_name: z.string().min(1, 'Vui lòng chọn hoặc nhập loại phụ tùng'),
  brand: z.string().optional(),
  price: z.number().min(0, 'Giá tiền không được âm').optional(),
  quantity: z.number().min(1, 'Số lượng ít nhất là 1').optional(),
  maintenance_date: z.date({ message: 'Ngày bảo trì không được để trống' }),
  notes: z.string().optional(),
})

export type CreateMaintenanceLogInput = z.infer<typeof createMaintenanceLogSchema>
