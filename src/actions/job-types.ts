'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createJobTypeSchema, updateJobTypeSchema } from '@/schemas/service'
import type { Result } from '@/types/result'
import type { Job_Type } from '@prisma/client'

export async function listJobTypes() {
  await requireAuth()

  return await prisma.job_Type.findMany({
    orderBy: { name: 'asc' },
    include: { service: true },
  })
}

export async function createJobType(input: unknown): Promise<Result<Job_Type>> {
  try {
    await requireAuth()
    const validated = createJobTypeSchema.parse(input)

    const jobType = await prisma.job_Type.create({
      data: validated,
    })

    revalidatePath(`/dashboard/services/${validated.service_id}`)
    return { success: true, data: jobType }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo loại công việc' }
  }
}

export async function updateJobType(
  id: string,
  input: unknown
): Promise<Result<Job_Type>> {
  try {
    await requireAuth()
    const validated = updateJobTypeSchema.parse(input)

    const jobType = await prisma.job_Type.update({
      where: { id },
      data: validated,
    })

    revalidatePath(`/dashboard/services/${jobType.service_id}`)
    return { success: true, data: jobType }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật loại công việc' }
  }
}

export async function deleteJobType(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    const jobType = await prisma.job_Type.findUnique({ where: { id } })
    if (!jobType) {
      return { success: false, error: 'Loại công việc không tồn tại' }
    }

    await prisma.job_Type.delete({
      where: { id },
    })

    revalidatePath(`/dashboard/services/${jobType.service_id}`)
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa loại công việc' }
  }
}
