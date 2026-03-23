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

    const booking = await prisma.booking.create({
      data: {
        customer_id: validated.customer_id,
        land_id: validated.land_id,
        amount: validated.amount,
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

    const booking = await prisma.booking.update({
      where: { id },
      data: validated,
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

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { bill_id: true },
    })

    if (booking?.bill_id) {
      return { success: false, error: 'Không thể xóa booking đã có trong hóa đơn' }
    }

    await prisma.booking.delete({ where: { id } })

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
      daily_bookings: {
        include: {
          work_day: true,
        },
        orderBy: { created_at: 'desc' },
        take: 5,
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
      bill: true,
      daily_bookings: {
        include: {
          work_day: true,
          machines: {
            include: {
              daily_machine: {
                include: {
                  machine: {
                    include: { machine_type: true },
                  },
                  workers: {
                    include: {
                      worker: true,
                      job_type: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      },
    },
  })
}
