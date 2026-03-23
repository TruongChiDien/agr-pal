import { z } from 'zod'
import { BookingStatus } from '@/types/enums'

export const createBookingSchema = z.object({
  customer_id: z.string().min(1, 'Khách hàng không được để trống'),
  land_id: z.string().optional(),
  amount: z.number().min(0, 'Amount phải lớn hơn hoặc bằng 0').optional(),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
})

export const updateBookingSchema = z.object({
  status: z.nativeEnum(BookingStatus).optional(),
  land_id: z.string().optional(),
  amount: z.number().min(0, 'Amount phải lớn hơn hoặc bằng 0').optional(),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
})
