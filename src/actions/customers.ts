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
  const customers = await prisma.customer.findMany({
    include: { lands: true, bills: true },
    orderBy: { name: 'asc' },
  })

  // Convert Decimal to number for serialization
  return customers.map(customer => ({
    ...customer,
    lands: customer.lands?.map(land => ({
      ...land,
      gps_lat: land.gps_lat ? Number(land.gps_lat) : null,
      gps_lng: land.gps_lng ? Number(land.gps_lng) : null,
    })),
    bills: customer.bills?.map(bill => ({
      ...bill,
      total_amount: Number(bill.total_amount),
      total_paid: Number(bill.total_paid),
    })),
  }))
}

export async function getCustomer(id: string) {
  await requireAuth()
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { lands: true, bookings: true, bills: true },
  })

  if (!customer) return null

  // Convert Decimal to number for serialization
  return {
    ...customer,
    lands: customer.lands?.map(land => ({
      ...land,
      gps_lat: land.gps_lat ? Number(land.gps_lat) : null,
      gps_lng: land.gps_lng ? Number(land.gps_lng) : null,
    })),
    bookings: customer.bookings?.map(booking => ({
      ...booking,
      quantity: Number(booking.quantity),
      captured_price: Number(booking.captured_price),
      total_amount: Number(booking.total_amount),
    })),
    bills: customer.bills?.map(bill => ({
      ...bill,
      total_amount: Number(bill.total_amount),
      total_paid: Number(bill.total_paid),
    })),
  }
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

    // Convert Decimal to number for serialization
    return {
      success: true,
      data: {
        ...land,
        gps_lat: land.gps_lat ? Number(land.gps_lat) : null,
        gps_lng: land.gps_lng ? Number(land.gps_lng) : null,
      } as Land
    }
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

    // Convert Decimal to number for serialization
    return {
      success: true,
      data: {
        ...land,
        gps_lat: land.gps_lat ? Number(land.gps_lat) : null,
        gps_lng: land.gps_lng ? Number(land.gps_lng) : null,
      } as Land
    }
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
