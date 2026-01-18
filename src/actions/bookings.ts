'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createBookingSchema, updateBookingSchema } from '@/schemas/booking'
import type { Result } from '@/types/result'
import type { Booking } from '@prisma/client'

export async function createBooking(input: unknown): Promise<Result<Booking>> {
  try {
    await requireAuth()
    const validated = createBookingSchema.parse(input)

    // Snapshot pattern: capture current price
    const service = await prisma.service.findUnique({
      where: { id: validated.service_id },
      select: { price: true },
    })

    if (!service) {
      return { success: false, error: 'Dịch vụ không tồn tại' }
    }

    const captured_price = validated.captured_price ?? Number(service.price)
    const quantity = validated.quantity ?? 0
    const total_amount = quantity * captured_price

    const booking = await prisma.booking.create({
      data: {
        customer_id: validated.customer_id,
        land_id: validated.land_id,
        service_id: validated.service_id,
        quantity: validated.quantity,
        captured_price,
        total_amount,
        notes: validated.notes,
      },
    })

    revalidatePath('/dashboard/bookings')
    return { success: true, data: booking }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo booking' }
  }
}

export async function updateBooking(id: string, input: unknown): Promise<Result<Booking>> {
  try {
    await requireAuth()
    const validated = updateBookingSchema.parse(input)

    // Fetch current booking to recalculate total if quantity changes
    const currentBooking = await prisma.booking.findUnique({
      where: { id },
      select: { captured_price: true, quantity: true },
    })

    if (!currentBooking) {
      return { success: false, error: 'Booking không tồn tại' }
    }

    // Recalculate total_amount if quantity is being updated
    let total_amount: number | undefined
    if (validated.quantity !== undefined) {
      const quantity = validated.quantity
      const captured_price = Number(currentBooking.captured_price)
      total_amount = quantity * captured_price
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...validated,
        ...(total_amount !== undefined && { total_amount }),
      },
    })

    revalidatePath('/dashboard/bookings')
    return { success: true, data: booking }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật booking' }
  }
}

export async function deleteBooking(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    // Check if booking is in bill
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { bill_id: true },
    })

    if (booking?.bill_id) {
      return { success: false, error: 'Không thể xóa booking đã có trong hóa đơn' }
    }

    await prisma.booking.delete({
      where: { id },
    })

    revalidatePath('/dashboard/bookings')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa booking' }
  }
}

export async function listBookings() {
  await requireAuth()
  return await prisma.booking.findMany({
    include: {
      customer: true,
      land: true,
      service: {
        include: {
          job_types: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function getBooking(id: string) {
  await requireAuth()
  return await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      land: true,
      service: true,
      jobs: {
        include: {
          job_type: {
            include: {
              service: true,
            },
          },
          worker: true,
        },
      },
      bill: true,
    },
  })
}
