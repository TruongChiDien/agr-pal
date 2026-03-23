'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { JobPaymentStatus } from '@/types/enums'
import { createWorkerSchema, updateWorkerSchema, createAdvancePaymentSchema, updateAdvancePaymentSchema } from '@/schemas/worker'
import type { Result } from '@/types/result'
import type { Worker, Advance_Payment } from '@prisma/client'

// Worker CRUD
export async function createWorker(input: unknown): Promise<Result<Worker>> {
  try {
    await requireAuth()
    const validated = createWorkerSchema.parse(input)

    const worker = await prisma.worker.create({
      data: validated,
    })

    revalidatePath('/dashboard/workers')
    return { success: true, data: worker }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo công nhân' }
  }
}

export async function updateWorker(id: string, input: unknown): Promise<Result<Worker>> {
  try {
    await requireAuth()
    const validated = updateWorkerSchema.parse(input)

    const worker = await prisma.worker.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/dashboard/workers')
    return { success: true, data: worker }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật công nhân' }
  }
}

export async function deleteWorker(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.worker.delete({
      where: { id },
    })

    revalidatePath('/dashboard/workers')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa công nhân' }
  }
}

export async function listWorkers() {
  await requireAuth()
  return await prisma.worker.findMany({
    include: {
      _count: {
        select: { daily_workers: true },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getWorker(id: string) {
  await requireAuth()
  return await prisma.worker.findUnique({
    where: { id },
    include: {
      daily_workers: {
        include: {
          job_type: true,
          daily_machine: {
            include: {
              machine: { include: { machine_type: true } },
              work_day: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 30,
      },
      advance_payments: {
        orderBy: { created_at: 'desc' },
      },
      payroll_sheets: {
        orderBy: { created_at: 'desc' },
      },
    },
  })
}

// Advance_Payment CRUD
export async function createAdvancePayment(input: unknown): Promise<Result<Advance_Payment>> {
  try {
    await requireAuth()
    const validated = createAdvancePaymentSchema.parse(input)

    const advance = await prisma.advance_Payment.create({
      data: validated,
    })

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/payroll')
    return { success: true, data: advance }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo tạm ứng' }
  }
}

export async function updateAdvancePayment(id: string, input: unknown): Promise<Result<Advance_Payment>> {
  try {
    await requireAuth()
    const validated = updateAdvancePaymentSchema.parse(input)

    // Check existing
    const existing = await prisma.advance_Payment.findUnique({
        where: { id },
        select: { payroll_id: true }
    })

    if (!existing) {
        return { success: false, error: 'Không tìm thấy tạm ứng' }
    }

    if (existing.payroll_id && validated.amount !== undefined) {
         delete validated.amount;
    }

    const advance = await prisma.advance_Payment.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/payroll')
    return { success: true, data: advance }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật tạm ứng' }
  }
}

export async function deleteAdvancePayment(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    // Check if advance is already processed
    const advance = await prisma.advance_Payment.findUnique({
      where: { id },
      select: { payroll_id: true },
    })

    if (advance?.payroll_id) {
      return { success: false, error: 'Không thể xóa tạm ứng đã có trong phiếu lương' }
    }

    await prisma.advance_Payment.delete({
      where: { id },
    })

    revalidatePath('/dashboard/workers')
    revalidatePath('/dashboard/payroll')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa tạm ứng' }
  }
}

// ── Daily Workers for Select ────────────────────────────────

export async function listPendingDailyWorkers(workerId: string) {
  await requireAuth()
  return await prisma.dailyMachineWorker.findMany({
    where: {
      worker_id: workerId,
      payment_status: JobPaymentStatus.PendingPayroll,
    },
    include: {
      daily_machine: {
        include: {
          machine: true,
          work_day: true,
        },
      },
      job_type: true,
    },
    orderBy: {
      daily_machine: {
        work_day: {
          date: 'desc',
        },
      },
    },
  })
}

export async function listPayrollDailyWorkers(payrollId: string) {
  await requireAuth()
  return await prisma.dailyMachineWorker.findMany({
    where: {
      payroll_id: payrollId,
    },
    include: {
      daily_machine: {
        include: {
          machine: true,
          work_day: true,
        },
      },
      job_type: true,
    },
  })
}

