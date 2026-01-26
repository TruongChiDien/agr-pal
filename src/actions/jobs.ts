'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createJobSchema, updateJobSchema } from '@/schemas/job'
import type { Result } from '@/types/result'
import type { Job } from '@prisma/client'

// Job CRUD (merged with Job_Worker - 1:1 relationship)
export async function createJob(input: unknown): Promise<Result<Job>> {
  try {
    await requireAuth()
    const validated = createJobSchema.parse(input)

    // Fetch job_type base salary (snapshot pattern)
    const jobType = await prisma.job_Type.findUnique({
      where: { id: validated.job_type_id },
      select: { default_base_salary: true },
    })

    if (!jobType) {
      return { success: false, error: 'Loại công việc không tồn tại' }
    }

    // Fetch worker weight (snapshot pattern)
    const workerWeight = await prisma.worker_Weight.findUnique({
      where: {
        worker_id_job_type_id: {
          worker_id: validated.worker_id,
          job_type_id: validated.job_type_id,
        },
      },
      select: { weight: true },
    })

    // Calculate snapshot values
    const applied_base = validated.applied_base ?? Number(jobType.default_base_salary)
    const applied_weight = validated.applied_weight ?? (workerWeight ? Number(workerWeight.weight) : 1.0)
    const actual_qty = validated.actual_qty ?? 0
    const payment_adjustment = validated.payment_adjustment ?? 0
    
    // Formula: (qty * base * weight) + adjustment
    const final_pay = (actual_qty * applied_base * applied_weight) + payment_adjustment

    const job = await prisma.job.create({
      data: {
        booking_id: validated.booking_id,
        job_type_id: validated.job_type_id,
        worker_id: validated.worker_id,
        machine_id: validated.machine_id,
        notes: validated.notes,
        actual_qty,
        applied_base,
        applied_weight,
        final_pay,
        payment_adjustment,
      },
    })

    revalidatePath('/dashboard/jobs')
    return { success: true, data: job }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo job' }
  }
}

export async function updateJob(id: string, input: unknown): Promise<Result<Job>> {
  try {
    await requireAuth()
    const validated = updateJobSchema.parse(input)

    // Recalculate final_pay if factors change
    let final_pay: number | undefined

    if (validated.actual_qty !== undefined || validated.payment_adjustment !== undefined) {
      const existing = await prisma.job.findUnique({
        where: { id },
        select: { 
          applied_base: true, 
          applied_weight: true,
          actual_qty: true,
          payment_adjustment: true
        },
      })

      if (!existing) {
        return { success: false, error: 'Job không tồn tại' }
      }

      const qty = validated.actual_qty ?? Number(existing.actual_qty)
      const adjustment = validated.payment_adjustment ?? Number(existing.payment_adjustment)
      
      final_pay = (qty * Number(existing.applied_base) * Number(existing.applied_weight)) + adjustment
    }

      const job = await prisma.job.update({
      where: { id },
      data: {
        ...validated,
        ...(final_pay !== undefined && { final_pay }),
      },
    })
    
    revalidatePath('/dashboard/jobs')
    return { success: true, data: job }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật job' }
  }
}

export async function deleteJob(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.job.delete({
      where: { id },
    })

    revalidatePath('/dashboard/jobs')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa job' }
  }
}

export async function listJobs() {
  await requireAuth()
  return await prisma.job.findMany({
    include: {
      booking: {
        include: {
          customer: true,
          service: true,
        },
      },
      job_type: {
        include: {
          service: true,
        },
      },
      worker: true,
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function getJob(id: string) {
  await requireAuth()
  return await prisma.job.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          customer: true,
          land: true,
          service: true,
        },
      },
      job_type: {
        include: {
          service: true,
        },
      },
      machine: true,
      worker: {
        include: {
          worker_weights: {
            include: {
              job_type: true,
            },
          },
        },
      },
      payroll: true,
    },
  })
}
