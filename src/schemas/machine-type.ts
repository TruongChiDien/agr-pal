import { z } from 'zod'

// ── MachineType ─────────────────────────────────────────────

export const createMachineTypeSchema = z.object({
  name: z.string().min(1, 'Tên loại máy không được để trống').max(200),
  description: z.string().max(500).optional(),
  job_types: z
    .array(
      z.object({
        name: z.string().min(1, 'Tên loại công việc không được để trống').max(200),
        default_base_salary: z
          .number({ message: 'Lương cơ bản là bắt buộc' })
          .min(0, 'Lương cơ bản phải >= 0'),
      })
    )
    .optional(),
})

export const updateMachineTypeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
})

// ── Job_Type ─────────────────────────────────────────────────

export const createJobTypeSchema = z.object({
  name: z.string().min(1, 'Tên loại công việc không được để trống').max(200),
  default_base_salary: z
    .number({ message: 'Lương cơ bản là bắt buộc' })
    .min(0, 'Lương cơ bản phải lớn hơn hoặc bằng 0'),
})

export const updateJobTypeSchema = createJobTypeSchema.partial()
