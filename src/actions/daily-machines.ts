'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import {
  addDailyMachineSchema,
  updateDailyMachineSchema,
  assignWorkerSchema,
} from '@/schemas/work-day'
import type { Result } from '@/types/result'
import type { DailyMachine, DailyMachineWorker } from '@prisma/client'

/**
 * Thêm machine vào ngày và optionally assign workers.
 * Workers được tự động tạo DailyMachineWorker với snapshot salary.
 */
export async function addMachineToDay(input: unknown): Promise<Result<DailyMachine>> {
  try {
    await requireAuth()
    const validated = addDailyMachineSchema.parse(input)

    const existing = await prisma.dailyMachine.findUnique({
      where: {
        work_day_id_machine_id: {
          work_day_id: validated.work_day_id,
          machine_id: validated.machine_id,
        },
      },
    })
    if (existing) {
      return { success: false, error: 'Máy này đã có trong ngày làm việc' }
    }

    const dailyMachine = await prisma.$transaction(async (tx) => {
      const dm = await tx.dailyMachine.create({
        data: {
          work_day_id: validated.work_day_id,
          machine_id: validated.machine_id,
          amount: validated.amount,
          notes: validated.notes,
        },
      })

      if (validated.workers && validated.workers.length > 0) {
        for (const w of validated.workers) {
          await _createWorkerEntry(tx, dm.id, w.worker_id, w.job_type_id)
        }
      }

      return dm
    })

    revalidatePath(`/dashboard/work-days/${validated.work_day_id}`)
    return { success: true, data: dailyMachine }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi thêm máy vào ngày' }
  }
}

export async function updateDailyMachine(id: string, input: unknown): Promise<Result<DailyMachine>> {
  try {
    await requireAuth()
    const validated = updateDailyMachineSchema.parse(input)

    const dailyMachine = await prisma.dailyMachine.update({
      where: { id },
      data: validated,
    })

    revalidatePath(`/dashboard/work-days/${dailyMachine.work_day_id}`)
    return { success: true, data: dailyMachine }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật máy' }
  }
}

export async function removeMachineFromDay(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    const dm = await prisma.dailyMachine.findUnique({
      where: { id },
      select: { work_day_id: true },
    })

    await prisma.dailyMachine.delete({ where: { id } })

    if (dm) revalidatePath(`/dashboard/work-days/${dm.work_day_id}`)
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi gỡ máy khỏi ngày' }
  }
}

/**
 * Assign thêm 1 worker vào job type của machine trong ngày.
 * Tự động snapshot base_salary từ job_type.
 */
export async function assignWorkerToSlot(input: unknown): Promise<Result<DailyMachineWorker>> {
  try {
    await requireAuth()
    const validated = assignWorkerSchema.parse(input)

    const dailyMachineWorker = await prisma.$transaction(async (tx) => {
      return await _createWorkerEntry(
        tx,
        validated.daily_machine_id,
        validated.worker_id,
        validated.job_type_id,
        validated.applied_base,
        validated.applied_weight,
        validated.notes
      )
    })

    const dm = await prisma.dailyMachine.findUnique({
      where: { id: validated.daily_machine_id },
      select: { work_day_id: true },
    })
    if (dm) revalidatePath(`/dashboard/work-days/${dm.work_day_id}`)

    return { success: true, data: dailyMachineWorker }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi thêm worker' }
  }
}

export async function removeWorkerFromMachine(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    const dmw = await prisma.dailyMachineWorker.findUnique({
      where: { id },
      select: { daily_machine: { select: { work_day_id: true } } },
    })

    await prisma.dailyMachineWorker.delete({ where: { id } })

    if (dmw) revalidatePath(`/dashboard/work-days/${dmw.daily_machine.work_day_id}`)
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi gỡ worker' }
  }
}

// ── Internal helper ──────────────────────────────────────────

async function _createWorkerEntry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  daily_machine_id: string,
  worker_id: string,
  job_type_id: string,
  applied_base?: number,
  applied_weight?: number,
  notes?: string
): Promise<DailyMachineWorker> {
  const jobType = await tx.job_Type.findUnique({ where: { id: job_type_id } })

  if (!jobType) throw new Error(`Loại công việc ${job_type_id} không tồn tại`)

  const base = applied_base ?? Number(jobType.default_base_salary)
  const weight = applied_weight ?? 1.0

  return await tx.dailyMachineWorker.create({
    data: {
      daily_machine_id,
      worker_id,
      job_type_id,
      applied_base: base,
      applied_weight: weight,
      notes,
    },
  })
}
