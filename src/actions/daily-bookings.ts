'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import {
  addDailyBookingSchema,
  updateDailyBookingSchema,
  linkMachineToBookingSchema,
} from '@/schemas/work-day'
import type { Result } from '@/types/result'
import type { DailyBooking } from '@prisma/client'

export async function addBookingToDay(input: unknown): Promise<Result<DailyBooking>> {
  try {
    await requireAuth()
    const validated = addDailyBookingSchema.parse(input)

    const existing = await prisma.dailyBooking.findUnique({
      where: {
        work_day_id_booking_id: {
          work_day_id: validated.work_day_id,
          booking_id: validated.booking_id,
        },
      },
    })
    if (existing) {
      return { success: false, error: 'Booking này đã có trong ngày làm việc' }
    }

    const dailyBooking = await prisma.dailyBooking.create({
      data: {
        work_day_id: validated.work_day_id,
        booking_id: validated.booking_id,
        amount: validated.amount,
        notes: validated.notes,
      },
    })

    revalidatePath(`/dashboard/work-days/${validated.work_day_id}`)
    return { success: true, data: dailyBooking }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi thêm booking vào ngày' }
  }
}

export async function updateDailyBooking(id: string, input: unknown): Promise<Result<DailyBooking>> {
  try {
    await requireAuth()
    const validated = updateDailyBookingSchema.parse(input)

    const dailyBooking = await prisma.dailyBooking.update({
      where: { id },
      data: validated,
    })

    revalidatePath(`/dashboard/work-days/${dailyBooking.work_day_id}`)
    return { success: true, data: dailyBooking }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật booking' }
  }
}

export async function removeBookingFromDay(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    const dailyBooking = await prisma.dailyBooking.findUnique({
      where: { id },
      select: { work_day_id: true },
    })

    await prisma.dailyBooking.delete({ where: { id } })

    if (dailyBooking) {
      revalidatePath(`/dashboard/work-days/${dailyBooking.work_day_id}`)
    }
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi gỡ booking khỏi ngày' }
  }
}

export async function linkMachineToBooking(input: unknown): Promise<Result<void>> {
  try {
    await requireAuth()
    const validated = linkMachineToBookingSchema.parse(input)

    await prisma.dailyBookingMachine.create({ data: validated })

    // Revalidate by fetching work_day_id
    const db = await prisma.dailyBooking.findUnique({
      where: { id: validated.daily_booking_id },
      select: { work_day_id: true },
    })
    if (db) revalidatePath(`/dashboard/work-days/${db.work_day_id}`)

    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi liên kết machine và booking' }
  }
}

export async function unlinkMachineFromBooking(
  daily_booking_id: string,
  daily_machine_id: string
): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.dailyBookingMachine.deleteMany({
      where: { daily_booking_id, daily_machine_id },
    })

    const db = await prisma.dailyBooking.findUnique({
      where: { id: daily_booking_id },
      select: { work_day_id: true },
    })
    if (db) revalidatePath(`/dashboard/work-days/${db.work_day_id}`)

    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi gỡ liên kết' }
  }
}
