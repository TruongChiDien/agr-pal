'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createBillSchema, updateBillSchema } from '@/schemas/bill'
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
    const adjustment = validated.adjustment || 0

    const total_amount = subtotal + adjustment

    if (total_amount < 0) {
      return { success: false, error: 'Tổng tiền hóa đơn không thể nhỏ hơn 0' }
    }

    // Transaction: create bill + update bookings
    const bill = (await prisma.$transaction(async (tx: any) => {
      const newBill = await tx.bill.create({
        data: {
          customer_id: validated.customer_id,
          subtotal,
          adjustment,
          notes: validated.notes || null,
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

export async function updateBill(id: string, input: unknown): Promise<Result<Bill>> {
  try {
    await requireAuth()
    const validated = updateBillSchema.parse(input)

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { bookings: true }
    })

    if (!bill) {
      return { success: false, error: 'Hóa đơn không tồn tại' }
    }

    // Check if bill is editable (financials)
    const isFinancialEditable = bill.status === BillStatus.Open && Number(bill.total_paid) === 0

    // If not editable, only allow notes update
    if (!isFinancialEditable) {
      if (validated.booking_ids || validated.adjustment !== undefined) {
         // Silently ignore or return specific message? stick to requirement: only allow notes
         // We will just proceed updating notes only.
      }
      
      const updated = await prisma.bill.update({
        where: { id },
        data: {
          notes: validated.notes,
        } as any
      })
      revalidatePath('/dashboard/bills')
      return { success: true, data: updated }
    }

    // If editable, handle everything
    const result = await prisma.$transaction(async (tx: any) => {
      let subtotal = Number(bill.subtotal)
      let bookingIds = bill.bookings.map(b => b.id)

      // 1. Handle booking changes
      if (validated.booking_ids) {
        // Find bookings to remove
        const toRemove = bookingIds.filter(bid => !validated.booking_ids?.includes(bid))
        // Find bookings to add
        const toAdd = validated.booking_ids.filter(bid => !bookingIds.includes(bid))
        
        // Remove: reset status
        if (toRemove.length > 0) {
           await tx.booking.updateMany({
             where: { id: { in: toRemove } },
             data: { bill_id: null, payment_status: PaymentStatus.PendingBill }
           })
        }
        
        // Add: set status
        if (toAdd.length > 0) {
           // Verify candidate bookings
           const candidates = await tx.booking.findMany({
             where: { id: { in: toAdd }, payment_status: PaymentStatus.PendingBill, customer_id: bill.customer_id }
           })
           if (candidates.length !== toAdd.length) {
             throw new Error("Một số booking mới không hợp lệ hoặc đã có hóa đơn")
           }
           await tx.booking.updateMany({
             where: { id: { in: toAdd } },
             data: { bill_id: id, payment_status: PaymentStatus.AddedBill }
           })
        }
        
        // Recalculate subtotal from ALL current bookings (in validated.booking_ids)
        const allBookings = await tx.booking.findMany({
           where: { id: { in: validated.booking_ids } }
        })
        subtotal = allBookings.reduce((sum: number, b: any) => sum + Number(b.total_amount), 0)
      }

      // 2. Handle adjustment
      const adjustment = validated.adjustment !== undefined ? validated.adjustment : Number((bill as any).adjustment)
      
      const total = subtotal + adjustment

      if (total < 0) {
        throw new Error("Tổng tiền hóa đơn không thể nhỏ hơn 0")
      }

      // 3. Update Bill
      const updated = await tx.bill.update({
        where: { id },
        data: {
          subtotal,
          adjustment,
          total_amount: total,
          notes: validated.notes !== undefined ? validated.notes : (bill as any).notes
        } as any
      })
      
      return updated
    })

    revalidatePath('/dashboard/bills')
    return { success: true, data: result }
    
  } catch (error) {
    console.error('Error updating bill:', error)
    if (error instanceof Error) {
      // Try to parse Zod error
      try {
        const zodErrors = JSON.parse(error.message)
        if (Array.isArray(zodErrors) && zodErrors[0]?.message) {
          return { success: false, error: zodErrors.map((e: any) => e.message).join(', ') }
        }
      } catch (e) {
        // Not a JSON error
      }
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật hóa đơn' }
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
