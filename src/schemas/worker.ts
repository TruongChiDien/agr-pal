import { z } from 'zod'

export const createWorkerSchema = z.object({
  name: z.string().min(1, 'Tên công nhân không được để trống').max(200, 'Tên công nhân tối đa 200 ký tự'),
  phone: z.string().max(20, 'Số điện thoại tối đa 20 ký tự').optional(),
  address: z.string().max(500, 'Địa chỉ tối đa 500 ký tự').optional(),
})

export const updateWorkerSchema = createWorkerSchema.partial()

// Worker_Weight schemas
export const createWorkerWeightSchema = z.object({
  worker_id: z.string().min(1, 'ID công nhân không được để trống'),
  job_type_id: z.string().min(1, 'ID loại công việc không được để trống'),
  weight: z.number().min(0.1, 'Hệ số lương phải lớn hơn hoặc bằng 0.1').max(5, 'Hệ số lương tối đa là 5'),
})

export const updateWorkerWeightSchema = z.object({
  weight: z.number().min(0.1, 'Hệ số lương phải lớn hơn hoặc bằng 0.1').max(5, 'Hệ số lương tối đa là 5'),
})

// Advance_Payment schemas
export const createAdvancePaymentSchema = z.object({
  worker_id: z.string().min(1, 'ID công nhân không được để trống'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
})
