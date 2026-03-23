'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import {
  createMachineTypeSchema,
  updateMachineTypeSchema,
  createJobTypeSchema,
  updateJobTypeSchema,
} from '@/schemas/machine-type'
import type { Result } from '@/types/result'
import type { MachineType, Job_Type } from '@prisma/client'

// ── MachineType ──────────────────────────────────────────────

export async function createMachineType(input: unknown): Promise<Result<MachineType>> {
  try {
    await requireAuth()
    const validated = createMachineTypeSchema.parse(input)

    const machineType = await prisma.machineType.create({
      data: {
        name: validated.name,
        description: validated.description,
        job_types: validated.job_types
          ? {
              create: validated.job_types.map((jt) => ({
                name: jt.name,
                default_base_salary: jt.default_base_salary,
              })),
            }
          : undefined,
      },
    })

    revalidatePath('/dashboard/machine-types')
    return { success: true, data: machineType }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo loại máy' }
  }
}

export async function updateMachineType(id: string, input: unknown): Promise<Result<MachineType>> {
  try {
    await requireAuth()
    const validated = updateMachineTypeSchema.parse(input)

    const machineType = await prisma.machineType.update({
      where: { id },
      data: { name: validated.name, description: validated.description },
    })

    revalidatePath('/dashboard/machine-types')
    return { success: true, data: machineType }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật loại máy' }
  }
}

export async function deleteMachineType(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    const hasLinkedMachines = await prisma.machine.count({ where: { machine_type_id: id } })
    if (hasLinkedMachines > 0) {
      return { success: false, error: 'Không thể xóa loại máy đang được sử dụng bởi máy khác' }
    }

    // Guard: check if any job type of this machine type is referenced in historical daily worker records
    const jobTypeIds = await prisma.job_Type.findMany({
      where: { machine_type_id: id },
      select: { id: true },
    })
    if (jobTypeIds.length > 0) {
      const hasWorkerHistory = await prisma.dailyMachineWorker.count({
        where: { job_type_id: { in: jobTypeIds.map((jt) => jt.id) } },
      })
      if (hasWorkerHistory > 0) {
        return { success: false, error: 'Không thể xóa loại máy đã có lịch sử công việc worker' }
      }
    }

    await prisma.machineType.delete({ where: { id } })

    revalidatePath('/dashboard/machine-types')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa loại máy' }
  }
}

export async function listMachineTypes() {
  await requireAuth()
  return await prisma.machineType.findMany({
    include: {
      job_types: { orderBy: { name: 'asc' } },
      _count: { select: { machines: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getMachineType(id: string) {
  await requireAuth()
  return await prisma.machineType.findUnique({
    where: { id },
    include: {
      job_types: { orderBy: { name: 'asc' } },
      machines: true,
    },
  })
}

// ── Job_Type ─────────────────────────────────────────────────

export async function createJobType(
  machine_type_id: string,
  input: unknown
): Promise<Result<Job_Type>> {
  try {
    await requireAuth()
    const validated = createJobTypeSchema.parse(input)

    const jobType = await prisma.job_Type.create({
      data: { ...validated, machine_type_id },
    })

    revalidatePath('/dashboard/machine-types')
    return { success: true, data: jobType }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo loại công việc' }
  }
}

export async function updateJobType(id: string, input: unknown): Promise<Result<Job_Type>> {
  try {
    await requireAuth()
    const validated = updateJobTypeSchema.parse(input)

    const jobType = await prisma.job_Type.update({ where: { id }, data: validated })

    revalidatePath('/dashboard/machine-types')
    return { success: true, data: jobType }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật loại công việc' }
  }
}

export async function deleteJobType(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    const inUse = await prisma.dailyMachineWorker.count({ where: { job_type_id: id } })
    if (inUse > 0) {
      return { success: false, error: 'Không thể xóa loại công việc đang được sử dụng' }
    }

    await prisma.job_Type.delete({ where: { id } })

    revalidatePath('/dashboard/machine-types')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) return { success: false, error: error.message }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa loại công việc' }
  }
}
