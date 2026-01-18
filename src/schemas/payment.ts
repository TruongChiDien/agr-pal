import { z } from 'zod'

export const addBillPaymentSchema = z.object({
  bill_id: z.string().min(1, 'Bill ID là bắt buộc'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  payment_date: z.date({
    required_error: 'Ngày thanh toán là bắt buộc',
  }),
  method: z.enum(['CASH', 'BANK_TRANSFER'], {
    required_error: 'Phương thức thanh toán là bắt buộc',
  }),
  notes: z.string().optional(),
})

export type AddBillPaymentInput = z.infer<typeof addBillPaymentSchema>

export const addPayrollPaymentSchema = z.object({
  payroll_id: z.string().min(1, 'Payroll ID là bắt buộc'),
  amount: z.number().positive('Số tiền phải lớn hơn 0'),
  payment_date: z.date({
    required_error: 'Ngày thanh toán là bắt buộc',
  }),
  method: z.enum(['CASH', 'BANK_TRANSFER'], {
    required_error: 'Phương thức thanh toán là bắt buộc',
  }),
  notes: z.string().optional(),
})

export type AddPayrollPaymentInput = z.infer<typeof addPayrollPaymentSchema>
