import { z } from 'zod'

export const createBillSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID là bắt buộc'),
  booking_ids: z.array(z.string().min(1)).min(1, 'Phải chọn ít nhất 1 booking'),
})
