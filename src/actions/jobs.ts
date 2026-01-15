'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createJobSchema, updateJobSchema, createJobWorkerSchema, updateJobWorkerSchema } from '@/schemas/job'
import type { Result } from '@/types/result'
import type { Job, Job_Worker } from '@prisma/client'

// Job CRUD
export async function createJob(input: unknown): Promise<Result<Job>> {
  try {
    await requireAuth()
    const validated = createJobSchema.parse(input)

    const job = await prisma.job.create({
      data: validated,
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

    const job = await prisma.job.update({
      where: { id },
      data: validated,
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
          land: true,
          service: true,
        },
      },
      job_type: true,
      machine: true,
      job_workers: {
        include: {
          worker: true,
        },
      },
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
      job_type: true,
      machine: true,
      job_workers: {
        include: {
          worker: true,
        },
      },
    },
  })
}

// Job_Worker CRUD with wage snapshot
export async function createJobWorker(input: unknown): Promise<Result<Job_Worker>> {
  try {
    await requireAuth()
    const validated = createJobWorkerSchema.parse(input)

    // Fetch job_type base salary (snapshot pattern)
    const job = await prisma.job.findUnique({
      where: { id: validated.job_id },
      select: {
        job_type: {
          select: { default_base_salary: true },
        },
      },
    })

    if (!job) {
      return { success: false, error: 'Job không tồn tại' }
    }

    // Fetch worker weight (snapshot pattern)
    const job_with_type = await prisma.job.findUnique({
      where: { id: validated.job_id },
      select: { job_type_id: true },
    })

    const workerWeight = await prisma.worker_Weight.findUnique({
      where: {
        worker_id_job_type_id: {
          worker_id: validated.worker_id,
          job_type_id: job_with_type!.job_type_id,
        },
      },
      select: { weight: true },
    })

    const applied_base = validated.applied_base ?? Number(job.job_type.default_base_salary)
    const applied_weight = validated.applied_weight ?? (workerWeight ? Number(workerWeight.weight) : 1.0)
    const final_pay = validated.actual_qty * applied_base * applied_weight

    const jobWorker = await prisma.job_Worker.create({
      data: {
        job_id: validated.job_id,
        worker_id: validated.worker_id,
        actual_qty: validated.actual_qty,
        applied_base,
        applied_weight,
        final_pay,
      },
    })

    revalidatePath('/dashboard/jobs')
    return { success: true, data: jobWorker }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo job worker' }
  }
}

export async function updateJobWorker(id: string, input: unknown): Promise<Result<Job_Worker>> {
  try {
    await requireAuth()
    const validated = updateJobWorkerSchema.parse(input)

    // Recalculate final_pay if actual_qty changes
    const existing = await prisma.job_Worker.findUnique({
      where: { id },
      select: { applied_base: true, applied_weight: true },
    })

    if (!existing) {
      return { success: false, error: 'Job Worker không tồn tại' }
    }

    const final_pay = validated.actual_qty
      ? validated.actual_qty * Number(existing.applied_base) * Number(existing.applied_weight)
      : undefined

    const jobWorker = await prisma.job_Worker.update({
      where: { id },
      data: {
        ...validated,
        ...(final_pay !== undefined && { final_pay }),
      },
    })

    revalidatePath('/dashboard/jobs')
    return { success: true, data: jobWorker }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật job worker' }
  }
}

export async function deleteJobWorker(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.job_Worker.delete({
      where: { id },
    })

    revalidatePath('/dashboard/jobs')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa job worker' }
  }
}
