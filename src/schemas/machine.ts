import { z } from 'zod'
import { MachineStatus } from '@/types/enums'

export const createMachineSchema = z.object({
  name: z.string().min(1, 'Tên máy là bắt buộc'),
  model: z.string().optional(),
  type: z.string().optional(),
  purchase_date: z.date().optional(),
})

export const updateMachineSchema = z.object({
  name: z.string().min(1).optional(),
  model: z.string().optional(),
  type: z.string().optional(),
  purchase_date: z.date().optional(),
  status: z.nativeEnum(MachineStatus).optional(),
})
