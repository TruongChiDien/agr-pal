import { z } from 'zod'

export const createWorkerSchema = z.object({
  name: z.string().min(1, 'Tên công nhân là bắt buộc'),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const updateWorkerSchema = createWorkerSchema.partial()

// Worker_Weight schemas
export const createWorkerWeightSchema = z.object({
  worker_id: z.string().min(1, 'Worker ID là bắt buộc'),
  job_type_id: z.string().min(1, 'Job Type ID là bắt buộc'),
  weight: z.number().min(0.1, 'Hệ số phải lớn hơn 0.1').max(5, 'Hệ số tối đa là 5'),
})

export const updateWorkerWeightSchema = z.object({
  weight: z.number().min(0.1, 'Hệ số phải lớn hơn 0.1').max(5, 'Hệ số tối đa là 5'),
})

// Advance_Payment schemas
export const createAdvancePaymentSchema = z.object({
  worker_id: z.string().min(1, 'Worker ID là bắt buộc'),
  amount: z.number().min(0.01, 'Số tiền phải lớn hơn 0'),
  notes: z.string().optional(),
})
