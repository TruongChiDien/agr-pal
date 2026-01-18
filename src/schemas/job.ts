import { z } from 'zod'
import { JobStatus } from '@/types/enums'

// Create Job with worker assignment (all in one - Job_Worker merged)
export const createJobSchema = z.object({
  booking_id: z.string().min(1, 'Đơn hàng là bắt buộc'),
  job_type_id: z.string().min(1, 'Loại công việc là bắt buộc'),
  worker_id: z.string().min(1, 'Công nhân là bắt buộc'),
  machine_id: z.string().min(1).optional(),
  notes: z.string().optional(),

  // Worker assignment fields (snapshot values - optional, will be calculated if not provided)
  actual_qty: z.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0').default(0),
  applied_base: z.number().min(0, 'Lương cơ bản phải lớn hơn hoặc bằng 0').optional(),
  applied_weight: z.number().min(0, 'Hệ số lương phải lớn hơn hoặc bằng 0').optional(),
  final_pay: z.number().min(0, 'Tổng lương phải lớn hơn hoặc bằng 0').optional(),
})

export const updateJobSchema = z.object({
  status: z.enum([
    JobStatus.New,
    JobStatus.InProgress,
    JobStatus.Blocked,
    JobStatus.Completed,
    JobStatus.Canceled,
  ]).optional(),
  machine_id: z.string().min(1).optional(),
  notes: z.string().optional(),

  // Can update worker assignment
  worker_id: z.string().min(1).optional(),
  actual_qty: z.number().min(0).optional(),
  applied_base: z.number().min(0).optional(),
  applied_weight: z.number().min(0).optional(),
  final_pay: z.number().min(0).optional(),
})
