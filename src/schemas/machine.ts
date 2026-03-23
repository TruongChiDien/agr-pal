import { z } from 'zod'
import { MachineStatus } from '@/types/enums'

export const createMachineSchema = z.object({
  name: z.string().min(1, 'Tên máy không được để trống').max(200, 'Tên máy tối đa 200 ký tự'),
  model: z.string().max(100, 'Model tối đa 100 ký tự').optional(),
  machine_type_id: z.string().min(1, 'Loại máy không được để trống'),
  purchase_date: z.date().optional(),
})

export const updateMachineSchema = z.object({
  name: z.string().min(1, 'Tên máy không được để trống').max(200, 'Tên máy tối đa 200 ký tự').optional(),
  model: z.string().max(100, 'Model tối đa 100 ký tự').optional(),
  machine_type_id: z.string().min(1, 'Loại máy không được để trống').optional(),
  purchase_date: z.date().optional(),
  status: z.nativeEnum(MachineStatus).optional(),
})
