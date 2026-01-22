'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createMachineSchema, updateMachineSchema } from '@/schemas/machine'
import type { Result } from '@/types/result'
import type { Machine } from '@prisma/client'

export async function createMachine(input: unknown): Promise<Result<Machine>> {
  try {
    await requireAuth()
    const validated = createMachineSchema.parse(input)

    const machine = await prisma.machine.create({
      data: validated,
    })

    revalidatePath('/dashboard/machines')
    return { success: true, data: machine }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo máy' }
  }
}

export async function updateMachine(id: string, input: unknown): Promise<Result<Machine>> {
  try {
    await requireAuth()
    const validated = updateMachineSchema.parse(input)

    const machine = await prisma.machine.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/dashboard/machines')
    return { success: true, data: machine }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật máy' }
  }
}

export async function deleteMachine(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.machine.delete({
      where: { id },
    })

    revalidatePath('/dashboard/machines')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa máy' }
  }
}

export async function listMachines() {
  await requireAuth()
  return await prisma.machine.findMany({
    include: {
      jobs: {
        include: {
          booking: {
            include: {
              customer: true,
              service: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getMachine(id: string) {
  await requireAuth()
  return await prisma.machine.findUnique({
    where: { id },
    include: {
      jobs: {
        include: {
          booking: {
            include: {
              customer: true,
              land: true,
              service: true,
            },
          },
          job_type: true,
          worker: true,
        },
        orderBy: { created_at: 'desc' },
      },
    },
  })
}
