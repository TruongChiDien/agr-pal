import { z } from 'zod'
import { JobStatus } from '@/types/enums'

// Create Job with worker assignment (all in one - Job_Worker merged)
export const createJobSchema = z.object({
  booking_id: z.string().min(1, 'Đơn hàng không được để trống'),
  job_type_id: z.string().min(1, 'Loại công việc không được để trống'),
  worker_id: z.string().min(1, 'Công nhân không được để trống'),
  machine_id: z.string().min(1).optional(),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),

  // Worker assignment fields (snapshot values - optional, will be calculated if not provided)
  actual_qty: z.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0').optional(),
  applied_base: z.number().min(0, 'Lương cơ bản phải lớn hơn hoặc bằng 0').optional(),
  applied_weight: z.number().min(0, 'Hệ số lương phải lớn hơn hoặc bằng 0').optional(),
  final_pay: z.number().min(0, 'Tổng lương phải lớn hơn hoặc bằng 0').optional(),
  payment_adjustment: z.number().optional(),
})

export const updateJobSchema = z.object({
  status: z.nativeEnum(JobStatus).optional(),
  machine_id: z.string().min(1).optional(),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),

  // Can update worker assignment
  worker_id: z.string().min(1).optional(),
  actual_qty: z.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0').optional(),
  applied_base: z.number().min(0, 'Lương cơ bản phải lớn hơn hoặc bằng 0').optional(),
  applied_weight: z.number().min(0, 'Hệ số lương phải lớn hơn hoặc bằng 0').optional(),
  final_pay: z.number().min(0, 'Tổng lương phải lớn hơn hoặc bằng 0').optional(),
  payment_adjustment: z.number().optional(),
})
