'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createBillSchema } from '@/schemas/bill'
import { PaymentStatus } from '@/types/enums'
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

    const total_amount = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0)

    // Transaction: create bill + update bookings
    const bill = await prisma.$transaction(async (tx) => {
      const newBill = await tx.bill.create({
        data: {
          customer_id: validated.customer_id,
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
    })

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
    await prisma.$transaction(async (tx) => {
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
