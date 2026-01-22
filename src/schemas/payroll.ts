import { z } from 'zod'

export const createPayrollSchema = z.object({
  worker_id: z.string().min(1, 'ID công nhân không được để trống'),
  job_ids: z.array(z.string().min(1, 'ID công việc không hợp lệ')).min(1, 'Phải chọn ít nhất 1 công việc'),
  advance_payment_ids: z.array(z.string().min(1, 'ID ứng lương không hợp lệ')).optional(),
})
