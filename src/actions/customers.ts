'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createCustomerSchema, updateCustomerSchema, createLandSchema, updateLandSchema } from '@/schemas/customer'
import type { Result } from '@/types/result'
import type { Customer, Land } from '@prisma/client'

export async function createCustomer(input: unknown): Promise<Result<Customer>> {
  try {
    await requireAuth()
    const validated = createCustomerSchema.parse(input)

    const customer = await prisma.customer.create({
      data: validated,
    })

    revalidatePath('/dashboard/customers')
    return { success: true, data: customer }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo khách hàng' }
  }
}

export async function updateCustomer(id: string, input: unknown): Promise<Result<Customer>> {
  try {
    await requireAuth()
    const validated = updateCustomerSchema.parse(input)

    const customer = await prisma.customer.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/dashboard/customers')
    return { success: true, data: customer }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật khách hàng' }
  }
}

export async function deleteCustomer(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.customer.delete({
      where: { id },
    })

    revalidatePath('/dashboard/customers')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa khách hàng' }
  }
}

export async function listCustomers() {
  await requireAuth()
  return await prisma.customer.findMany({
    include: { lands: true },
    orderBy: { name: 'asc' },
  })
}

export async function getCustomer(id: string) {
  await requireAuth()
  return await prisma.customer.findUnique({
    where: { id },
    include: { lands: true, bookings: true, bills: true },
  })
}

// Land CRUD
export async function createLand(input: unknown): Promise<Result<Land>> {
  try {
    await requireAuth()
    const validated = createLandSchema.parse(input)

    const land = await prisma.land.create({
      data: validated,
    })

    revalidatePath('/dashboard/customers')
    return { success: true, data: land }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo ruộng' }
  }
}

export async function updateLand(id: string, input: unknown): Promise<Result<Land>> {
  try {
    await requireAuth()
    const validated = updateLandSchema.parse(input)

    const land = await prisma.land.update({
      where: { id },
      data: validated,
    })

    revalidatePath('/dashboard/customers')
    return { success: true, data: land }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi cập nhật ruộng' }
  }
}

export async function deleteLand(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    await prisma.land.delete({
      where: { id },
    })

    revalidatePath('/dashboard/customers')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa ruộng' }
  }
}
