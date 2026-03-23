'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { JobPaymentStatus } from '@/types/enums'
import {
  createWorkDaySchema,
  updateWorkDaySchema,
} from '@/schemas/work-day'
import type { Result } from '@/types/result'
import type { WorkDay } from '@prisma/client'

export async function createWorkDay(input: unknown): Promise<Result<WorkDay>> {
  try {
    await requireAuth()
    const validated = createWorkDaySchema.parse(input)

    // Normalize date to midnight UTC to ensure uniqueness by calendar date
    const date = new Date(validated.date)
    date.setUTCHours(0, 0, 0, 0)

    const existing = await prisma.workDay.findUnique({ where: { date } })
    if (existing) {
      return { success: false, error: 'Ngày làm việc này đã tồn tại' }
    }

    const workDay = await prisma.workDay.create({
      data: { date, notes: validated.notes },
    })

    revalidatePath('/dashboard/work-days')
    return { success: true, data: workDay }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo ngày làm việc' }
  }
}

export async function updateWorkDay(id: string, input: unknown): Promise<Result<WorkDay>> {
  try {
    await requireAuth()
    const validated = updateWorkDaySchema.parse(input)

    const workDay = await prisma.workDay.update({ where: { id }, data: validated })

    revalidatePath('/dashboard/work-days')
    revalidatePath(`/dashboard/work-days/${id}`)
    return { success: true, data: workDay }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật ngày làm việc' }
  }
}

export async function deleteWorkDay(id: string): Promise<Result<void>> {
  try {
    await requireAuth()
    await prisma.workDay.delete({ where: { id } })
    revalidatePath('/dashboard/work-days')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa ngày làm việc' }
  }
}

export async function listWorkDays() {
  await requireAuth()
  return await prisma.workDay.findMany({
    include: {
      _count: {
        select: { daily_bookings: true, daily_machines: true },
      },
      daily_bookings: {
        select: { amount: true },
      },
      daily_machines: {
        select: { amount: true },
      },
    },
    orderBy: { date: 'desc' },
  })
}

export async function getWorkDay(id: string) {
  await requireAuth()
  return await prisma.workDay.findUnique({
    where: { id },
    include: {
      daily_bookings: {
        include: {
          booking: {
            include: { customer: true, land: true },
          },
          machines: {
            include: {
              daily_machine: {
                include: {
                  machine: { include: { machine_type: true } },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'asc' },
      },
      daily_machines: {
        include: {
          machine: {
            include: {
              machine_type: {
                include: { job_types: true },
              },
            },
          },
          workers: {
            include: {
              worker: true,
              job_type: true,
            },
          },
          bookings: {
            include: {
              daily_booking: {
                include: { booking: { include: { customer: true } } },
              },
            },
          },
        },
        orderBy: { created_at: 'asc' },
      },
    },
  })
}

export async function getWorkDayByDate(date: Date) {
  await requireAuth()
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return await prisma.workDay.findUnique({ where: { date: d } })
}

// ── Daily Booking ───────────────────────────────────────────

export async function addDailyBooking(id: string, bookingId: string, amount?: number): Promise<Result<any>> {
  try {
    await requireAuth()
    const dailyBooking = await prisma.dailyBooking.create({
      data: {
        work_day_id: id,
        booking_id: bookingId,
        amount: amount ?? 0,
      },
    })
    revalidatePath(`/dashboard/work-days/${id}`)
    return { success: true, data: dailyBooking }
  } catch (error) {
    return { success: false, error: 'Lỗi addDailyBooking' }
  }
}

export async function removeDailyBooking(id: string, dailyBookingId: string): Promise<Result<void>> {
  try {
    await requireAuth()
    await prisma.dailyBooking.delete({ where: { id: dailyBookingId } })
    revalidatePath(`/dashboard/work-days/${id}`)
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Lỗi removeDailyBooking' }
  }
}

// ── Daily Machine ───────────────────────────────────────────

export async function addDailyMachine(
  id: string,
  machineId: string,
  amount: number,
  assignments: { job_type_id: string; worker_id: string }[]
): Promise<Result<any>> {
  try {
    await requireAuth()

    const dailyMachine = await prisma.$transaction(async (tx) => {
      const dm = await tx.dailyMachine.create({
        data: {
          work_day_id: id,
          machine_id: machineId,
          amount: amount,
        },
      })

      // Create assigned worker entries — snapshot base from job_type, weight defaults to 1.0
      for (const assign of assignments) {
        const jobType = await tx.job_Type.findUnique({
          where: { id: assign.job_type_id },
        })

        if (!jobType) throw new Error(`Loại công việc ${assign.job_type_id} không tồn tại`)

        await tx.dailyMachineWorker.create({
          data: {
            daily_machine_id: dm.id,
            worker_id: assign.worker_id,
            job_type_id: assign.job_type_id,
            applied_base: jobType.default_base_salary,
            applied_weight: 1.0,
          },
        })
      }

      return dm
    })

    revalidatePath(`/dashboard/work-days/${id}`)
    return { success: true, data: dailyMachine }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi addDailyMachine' }
  }
}

export async function removeDailyMachine(id: string, dailyMachineId: string): Promise<Result<void>> {
  try {
    await requireAuth()
    await prisma.dailyMachine.delete({ where: { id: dailyMachineId } })
    revalidatePath(`/dashboard/work-days/${id}`)
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Lỗi removeDailyMachine' }
  }
}

// ── Linking ────────────────────────────────────────────

export async function linkMachineToBooking(
  workDayId: string,
  dailyBookingId: string,
  dailyMachineId: string
): Promise<Result<void>> {
  try {
    await requireAuth()
    await prisma.dailyBookingMachine.create({
      data: {
        daily_booking_id: dailyBookingId,
        daily_machine_id: dailyMachineId,
      },
    })
    revalidatePath(`/dashboard/work-days/${workDayId}`)
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: 'Lỗi link' }
  }
}
