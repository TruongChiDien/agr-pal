'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createBillSchema } from '@/schemas/bill'
import { addBillPaymentSchema } from '@/schemas/payment'
import { PaymentStatus, BillStatus } from '@/types/enums'
import type { Result } from '@/types/result'
import type { Bill } from '@prisma/client'

export async function createBill(input: unknown): Promise<Result<Bill>> {
  try {
    await requireAuth()
    const validated = createBillSchema.parse(input)

    // Validate bookings
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: validated.booking_ids },
        customer_id: validated.customer_id,
        payment_status: PaymentStatus.PendingBill,
      },
    })

    if (bookings.length !== validated.booking_ids.length) {
      return { success: false, error: 'Một số booking đã có hóa đơn hoặc không hợp lệ' }
    }

    const subtotal = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
    const discount_amount = validated.discount_amount || 0

    // Validate discount doesn't exceed subtotal
    if (discount_amount > subtotal) {
      return { success: false, error: 'Số tiền giảm giá không thể lớn hơn tổng tiền hàng' }
    }

    const total_amount = subtotal - discount_amount

    // Transaction: create bill + update bookings
    // @ts-expect-error - Prisma v7 transaction callback type mismatch
    const bill = (await prisma.$transaction(async (tx: any) => {
      const newBill = await tx.bill.create({
        data: {
          customer_id: validated.customer_id,
          subtotal,
          discount_amount,
          discount_reason: validated.discount_reason || null,
          total_amount,
          total_paid: 0,
        },
      })

      await tx.booking.updateMany({
        where: { id: { in: validated.booking_ids } },
        data: {
          bill_id: newBill.id,
          payment_status: PaymentStatus.AddedBill,
        },
      })

      return newBill
    })) as Bill

    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard/bookings')
    return { success: true, data: bill }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo hóa đơn' }
  }
}

export async function listBills() {
  await requireAuth()
  return await prisma.bill.findMany({
    include: {
      customer: true,
      bookings: true,
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function getBill(id: string) {
  await requireAuth()
  return await prisma.bill.findUnique({
    where: { id },
    include: {
      customer: true,
      bookings: {
        include: {
          land: true,
          service: true,
        },
      },
      payments: {
        orderBy: {
          payment_date: 'desc',
        },
      },
    },
  })
}

export async function deleteBill(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    // Check bill status (cannot delete if partially paid)
    const bill = await prisma.bill.findUnique({
      where: { id },
      select: { status: true, total_paid: true },
    })

    if (!bill) {
      return { success: false, error: 'Hóa đơn không tồn tại' }
    }

    if (Number(bill.total_paid) > 0) {
      return { success: false, error: 'Không thể xóa hóa đơn đã có thanh toán' }
    }

    // Transaction: delete bill + reset bookings
    // @ts-expect-error - Prisma v7 transaction callback type mismatch
    await prisma.$transaction(async (tx: any) => {
      await tx.booking.updateMany({
        where: { bill_id: id },
        data: {
          bill_id: null,
          payment_status: PaymentStatus.PendingBill,
        },
      })

      await tx.bill.delete({
        where: { id },
      })
    })

    revalidatePath('/dashboard/bills')
    revalidatePath('/dashboard/bookings')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa hóa đơn' }
  }
}

export async function addBillPayment(input: unknown): Promise<Result<Bill>> {
  try {
    await requireAuth()
    const validated = addBillPaymentSchema.parse(input)

    // Get current bill
    const bill = await prisma.bill.findUnique({
      where: { id: validated.bill_id },
    })

    if (!bill) {
      return { success: false, error: 'Hóa đơn không tồn tại' }
    }

    const totalAmount = Number(bill.total_amount)
    const currentPaid = Number(bill.total_paid)
    const remainingBalance = totalAmount - currentPaid

    // Validate payment amount
    if (validated.amount > remainingBalance) {
      return {
        success: false,
        error: `Số tiền thanh toán (${validated.amount.toLocaleString('vi-VN')} đ) vượt quá số tiền còn lại (${remainingBalance.toLocaleString('vi-VN')} đ)`
      }
    }

    // Calculate new total_paid and status
    const newTotalPaid = currentPaid + validated.amount
    let newStatus = bill.status

    if (newTotalPaid >= totalAmount) {
      newStatus = BillStatus.Completed
    } else if (newTotalPaid > 0) {
      newStatus = BillStatus.PartialPaid
    }

    // Transaction: create payment record + update bill
    // @ts-expect-error - Prisma v7 transaction callback type mismatch
    const updatedBill = (await prisma.$transaction(async (tx: any) => {
      // Create payment record
      await tx.billPayment.create({
        data: {
          bill_id: validated.bill_id,
          amount: validated.amount,
          payment_date: validated.payment_date,
          method: validated.method,
          notes: validated.notes || null,
        },
      })

      // Update bill
      return await tx.bill.update({
        where: { id: validated.bill_id },
        data: {
          total_paid: newTotalPaid,
          status: newStatus,
        },
        include: {
          customer: true,
          bookings: {
            include: {
              land: true,
              service: true,
            },
          },
          payments: {
            orderBy: {
              payment_date: 'desc',
            },
          },
        },
      })
    })) as Bill

    revalidatePath('/dashboard/bills')
    revalidatePath(`/dashboard/bills/${validated.bill_id}`)
    return { success: true, data: updatedBill }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi thêm thanh toán' }
  }
}
