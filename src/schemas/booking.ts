import { z } from 'zod'
import { BookingStatus } from '@/types/enums'

export const createBookingSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID là bắt buộc'),
  land_id: z.string().min(1, 'Land ID là bắt buộc'),
  service_id: z.string().min(1, 'Service ID là bắt buộc'),
  quantity: z.number().min(0.01, 'Số lượng phải lớn hơn 0'),
  captured_price: z.number().min(0).optional(), // Auto-fetch if not provided
  notes: z.string().optional(),
})

export const updateBookingSchema = z.object({
  status: z.enum(BookingStatus).optional(),
  notes: z.string().optional(),
})
