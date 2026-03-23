import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Tên dịch vụ không được để trống').max(200),
  unit: z.string().min(1, 'Đơn vị không được để trống').max(50),
  price: z.number({ message: 'Giá dịch vụ là bắt buộc' }).min(0, 'Giá phải >= 0'),
  description: z.string().max(500).optional(),
  machine_type_ids: z.array(z.string()).optional(),
})

export const updateServiceSchema = createServiceSchema.partial()
