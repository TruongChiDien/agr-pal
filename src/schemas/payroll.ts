import { z } from 'zod'

export const createPayrollSchema = z.object({
  worker_id: z.string().min(1, 'Worker ID là bắt buộc'),
  job_worker_ids: z.array(z.string().min(1)).min(1, 'Phải chọn ít nhất 1 job worker'),
  advance_payment_ids: z.array(z.string().min(1)).optional(),
})
