import { z } from 'zod'
import { BookingStatus } from '@/types/enums'

export const createBookingSchema = z.object({
  service_id: z.string().min(1, 'Dịch vụ là bắt buộc'),
  customer_id: z.string().min(1, 'Khách hàng là bắt buộc'),
  land_id: z.string().optional(),
  quantity: z.number().min(0).optional(), // Optional, can be provided later
  captured_price: z.number().min(0).optional(), // Auto-fetch if not provided
  notes: z.string().optional(),
})

export const updateBookingSchema = z.object({
  status: z.enum(BookingStatus).optional(),
  land_id: z.string().optional(),
  quantity: z.number().min(0).optional(),
  notes: z.string().optional(),
})
