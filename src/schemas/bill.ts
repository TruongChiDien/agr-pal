import { z } from 'zod'

export const createBillSchema = z.object({
  customer_id: z.string().min(1, 'ID khách hàng không được để trống'),
  booking_ids: z.array(z.string().min(1, 'ID booking không hợp lệ')).min(1, 'Phải chọn ít nhất 1 booking'),
  discount_amount: z.number().min(0, 'Số tiền giảm giá phải lớn hơn hoặc bằng 0'),
  discount_reason: z.string().max(500, 'Lý do giảm giá tối đa 500 ký tự').optional(),
}).transform((data) => ({
  ...data,
  discount_amount: data.discount_amount || 0,
}))
