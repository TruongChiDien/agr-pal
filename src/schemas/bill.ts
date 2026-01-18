import { z } from 'zod'

export const createBillSchema = z.object({
  customer_id: z.string().min(1, 'Customer ID là bắt buộc'),
  booking_ids: z.array(z.string().min(1)).min(1, 'Phải chọn ít nhất 1 booking'),
  discount_amount: z.number().min(0, 'Số tiền giảm giá phải >= 0'),
  discount_reason: z.string().optional(),
}).transform((data) => ({
  ...data,
  discount_amount: data.discount_amount || 0,
}))
