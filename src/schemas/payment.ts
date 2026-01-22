import { z } from 'zod'

export const addBillPaymentSchema = z.object({
  bill_id: z.string().min(1, 'ID hóa đơn không được để trống'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  payment_date: z.date({
    message: 'Ngày thanh toán là bắt buộc',
  }),
  method: z.enum(['CASH', 'BANK_TRANSFER'], {
    message: 'Phương thức thanh toán là bắt buộc',
  }),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
})

export type AddBillPaymentInput = z.infer<typeof addBillPaymentSchema>

export const addPayrollPaymentSchema = z.object({
  payroll_id: z.string().min(1, 'ID bảng lương không được để trống'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  payment_date: z.date({
    message: 'Ngày thanh toán là bắt buộc',
  }),
  method: z.enum(['CASH', 'BANK_TRANSFER'], {
    message: 'Phương thức thanh toán là bắt buộc',
  }),
  notes: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
})

export type AddPayrollPaymentInput = z.infer<typeof addPayrollPaymentSchema>
