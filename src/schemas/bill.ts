import { z } from 'zod'

export const createBillSchema = z.object({
  customer_id: z.string().min(1, 'ID khách hàng không được để trống'),
  booking_ids: z.array(z.string().min(1, 'ID booking không hợp lệ')).min(1, 'Phải chọn ít nhất 1 booking'),
  adjustment: z.number(),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
}).transform((data) => ({
  ...data,
  adjustment: data.adjustment || 0,
}))

export const updateBillSchema = z.object({
  booking_ids: z.array(z.string()).optional(),
  adjustment: z.number().optional(),
  notes: z.string().max(500).optional(),
})
