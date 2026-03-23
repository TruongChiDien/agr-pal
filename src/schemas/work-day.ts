import { z } from 'zod'

// ── WorkDay ──────────────────────────────────────────────────

export const createWorkDaySchema = z.object({
  date: z.coerce.date(),
  notes: z.string().max(500).optional(),
})

export const updateWorkDaySchema = z.object({
  notes: z.string().max(500).optional(),
})

// ── DailyBooking ─────────────────────────────────────────────

export const addDailyBookingSchema = z.object({
  work_day_id: z.string().min(1, 'Ngày làm việc không được để trống'),
  booking_id: z.string().min(1, 'Booking không được để trống'),
  amount: z.number().min(0, 'Amount phải lớn hơn hoặc bằng 0').optional(),
  notes: z.string().max(500).optional(),
})

export const updateDailyBookingSchema = z.object({
  amount: z.number().min(0, 'Amount phải lớn hơn hoặc bằng 0').optional(),
  notes: z.string().max(500).optional(),
})

// ── DailyMachine ─────────────────────────────────────────────

const workerAssignmentSchema = z.object({
  worker_id: z.string().min(1, 'Worker không được để trống'),
  job_type_id: z.string().min(1, 'Loại công việc không được để trống'),
})

export const addDailyMachineSchema = z.object({
  work_day_id: z.string().min(1, 'Ngày làm việc không được để trống'),
  machine_id: z.string().min(1, 'Máy không được để trống'),
  amount: z.number().min(0, 'Amount phải lớn hơn hoặc bằng 0').optional(),
  notes: z.string().max(500).optional(),
  workers: z.array(workerAssignmentSchema).optional(),
})

export const updateDailyMachineSchema = z.object({
  amount: z.number().min(0, 'Amount phải lớn hơn hoặc bằng 0').optional(),
  notes: z.string().max(500).optional(),
})

// ── DailyMachineWorker ───────────────────────────────────────

export const assignWorkerSchema = z.object({
  daily_machine_id: z.string().min(1),
  worker_id: z.string().min(1, 'Worker không được để trống'),
  job_type_id: z.string().min(1, 'Loại công việc không được để trống'),
  applied_base: z.number().min(0).optional(),
  applied_weight: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
})

// ── DailyBookingMachine (trace-back link) ────────────────────

export const linkMachineToBookingSchema = z.object({
  daily_booking_id: z.string().min(1),
  daily_machine_id: z.string().min(1),
})
