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
    const { machine_type_ids, ...data } = createServiceSchema.parse(input)
    const service = await prisma.service.create({
      data: {
        ...data,
        machine_types: machine_type_ids?.length
          ? { create: machine_type_ids.map((id) => ({ machine_type_id: id })) }
          : undefined,
      },
    })
    revalidatePath('/dashboard/services')
    return { success: true, data: service }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi tạo dịch vụ' }
  }
}

export async function updateService(id: string, input: unknown): Promise<Result<Service>> {
  try {
    await requireAuth()
    const { machine_type_ids, ...data } = updateServiceSchema.parse(input)
    const service = await prisma.service.update({
      where: { id },
      data: {
        ...data,
        machine_types:
          machine_type_ids !== undefined
            ? {
                deleteMany: {},
                create: machine_type_ids.map((mid) => ({ machine_type_id: mid })),
              }
            : undefined,
      },
    })
    revalidatePath('/dashboard/services')
    return { success: true, data: service }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi cập nhật dịch vụ' }
  }
}

export async function deleteService(id: string): Promise<Result<void>> {
  try {
    await requireAuth()
    await prisma.service.delete({ where: { id } })
    revalidatePath('/dashboard/services')
    return { success: true, data: undefined }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Lỗi xóa dịch vụ' }
  }
}

export async function listServices() {
  await requireAuth()
  return prisma.service.findMany({
    include: { machine_types: { include: { machine_type: true } } },
    orderBy: { name: 'asc' },
  })
}
