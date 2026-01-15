import { z } from 'zod'
import { JobStatus } from '@/types/enums'

export const createJobSchema = z.object({
  booking_id: z.string().min(1, 'Booking ID là bắt buộc'),
  job_type_id: z.string().min(1, 'Job Type ID là bắt buộc'),
  machine_id: z.string().min(1).optional(),
  notes: z.string().optional(),
})

export const updateJobSchema = z.object({
  status: z.enum(JobStatus).optional(),
  machine_id: z.string().min(1).optional(),
  notes: z.string().optional(),
})

// Job_Worker schemas with wage snapshot
export const createJobWorkerSchema = z.object({
  job_id: z.string().min(1, 'Job ID là bắt buộc'),
  worker_id: z.string().min(1, 'Worker ID là bắt buộc'),
  actual_qty: z.number().min(0.01, 'Số lượng phải lớn hơn 0'),
  applied_base: z.number().min(0).optional(), // Auto-fetch from job_type
  applied_weight: z.number().min(0).optional(), // Auto-fetch from worker_weight
})

export const updateJobWorkerSchema = z.object({
  actual_qty: z.number().min(0.01).optional(),
})
