'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createServiceSchema, updateServiceSchema } from '@/schemas/service'
import type { Result } from '@/types/result'
import type { Service } from '@prisma/client'

export async function createService(input: unknown): Promise<Result<Service>> {
  try {
    await requireAuth()
    const validated = createServiceSchema.parse(input)

    const service = await prisma.service.create({
      data: validated,
    })

    revalidatePath('/dashboard/services')
    return { success: true, data: service }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo dịch vụ' }
  }
}

export async function updateService(
  id: string,
  input: unknown
): Promise<Result<Service>> {
  try {
    await requireAuth()
    const validated = updateServiceSchema.parse(input)

    const service = await prisma.service.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/dashboard/services')
    return { success: true, data: service }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật dịch vụ' }
  }
}

export async function deleteService(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.service.delete({
      where: { id },
    })

    revalidatePath('/dashboard/services')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa dịch vụ' }
  }
}

export async function listServices() {
  await requireAuth()
  return await prisma.service.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function getService(id: string) {
  await requireAuth()
  return await prisma.service.findUnique({
    where: { id },
    include: { job_types: true },
  })
}
