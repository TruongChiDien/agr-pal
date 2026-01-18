'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createWorkerSchema, updateWorkerSchema, createWorkerWeightSchema, updateWorkerWeightSchema, createAdvancePaymentSchema } from '@/schemas/worker'
import type { Result } from '@/types/result'
import type { Worker, Worker_Weight, Advance_Payment } from '@prisma/client'

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
      worker_weights: {
        include: {
          job_type: {
            include: {
              service: true,
            },
          },
        },
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
      worker_weights: {
        include: {
          job_type: {
            include: {
              service: true,
            },
          },
        },
      },
      jobs: {
        include: {
          booking: {
            include: {
              customer: true,
              service: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
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

// Worker_Weight CRUD
export async function createWorkerWeight(input: unknown): Promise<Result<Worker_Weight>> {
  try {
    await requireAuth()
    const validated = createWorkerWeightSchema.parse(input)

    const workerWeight = await prisma.worker_Weight.create({
      data: validated,
    })

    revalidatePath('/dashboard/workers')
    return { success: true, data: workerWeight }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo hệ số lương' }
  }
}

export async function updateWorkerWeight(id: string, input: unknown): Promise<Result<Worker_Weight>> {
  try {
    await requireAuth()
    const validated = updateWorkerWeightSchema.parse(input)

    const workerWeight = await prisma.worker_Weight.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/dashboard/workers')
    return { success: true, data: workerWeight }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật hệ số lương' }
  }
}

export async function deleteWorkerWeight(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.worker_Weight.delete({
      where: { id },
    })

    revalidatePath('/dashboard/workers')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa hệ số lương' }
  }
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
