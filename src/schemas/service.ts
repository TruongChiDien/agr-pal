import { z } from 'zod'

export const createServiceSchema = z.object({
  name: z.string().min(1, 'Tên dịch vụ không được để trống').max(200, 'Tên dịch vụ tối đa 200 ký tự'),
  unit: z.string().min(1, 'Đơn vị không được để trống').max(50, 'Đơn vị tối đa 50 ký tự'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional(),
  price: z.number({
    message: 'Giá dịch vụ là bắt buộc',
  }).min(0, 'Giá dịch vụ phải lớn hơn hoặc bằng 0'),
})

export const updateServiceSchema = createServiceSchema.partial()

export const createJobTypeSchema = z.object({
  service_id: z.string().min(1, 'ID dịch vụ là bắt buộc'),
  name: z.string().min(1, 'Tên loại công việc không được để trống').max(200, 'Tên tối đa 200 ký tự'),
  default_base_salary: z.number({
    message: 'Lương cơ bản là bắt buộc',
  }).min(0, 'Lương cơ bản phải lớn hơn hoặc bằng 0'),
})

export const updateJobTypeSchema = createJobTypeSchema.partial().omit({ service_id: true })
