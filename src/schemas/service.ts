import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Tên dịch vụ là bắt buộc'),
  unit: z.string().min(1, 'Đơn vị là bắt buộc'),
  description: z.string().optional(),
  price: z.number().min(0, 'Giá phải lớn hơn 0'),
})

export const updateServiceSchema = createServiceSchema.partial()
