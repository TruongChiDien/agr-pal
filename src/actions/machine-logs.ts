'use server'

import { prisma } from '@/lib/db'
import { createMaintenanceLogSchema, CreateMaintenanceLogInput } from '@/schemas/machine-logs'
import { Prisma } from '@prisma/client'

export async function getMaintenanceCategories() {
  try {
    const categories = await prisma.maintenanceCategory.findMany({
      orderBy: { name: 'asc' },
    })

    return { success: true, data: categories }
  } catch (error) {
    console.error('Error listing categories:', error)
    return { success: false, error: 'Failed to find maintenance categories' }
  }
}

export async function getMaintenanceLogs(machineId: string) {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      where: { machine_id: machineId },
      include: {
        category: true,
      },
      orderBy: { maintenance_date: 'desc' },
    })

    // Serialize Decimal for client
    const serializedLogs = logs.map(log => ({
      ...log,
      price: Number(log.price),
    }))

    return { success: true, data: serializedLogs }
  } catch (error) {
    console.error('Error fetching maintenance logs:', error)
    return { success: false, error: 'Failed to fetch maintenance logs' }
  }
}

export async function createMaintenanceLog(data: CreateMaintenanceLogInput) {
  try {
    const validatedData = createMaintenanceLogSchema.parse(data)

    // Find or create category
    let category = await prisma.maintenanceCategory.findUnique({
      where: { name: validatedData.category_name },
    })

    if (!category) {
      category = await prisma.maintenanceCategory.create({
        data: { name: validatedData.category_name },
      })
    }

    // Create log
    const log = await prisma.maintenanceLog.create({
      data: {
        machine_id: validatedData.machine_id,
        category_id: category.id,
        brand: validatedData.brand,
        price: new Prisma.Decimal(validatedData.price ?? 0),
        quantity: validatedData.quantity ?? 1,
        maintenance_date: validatedData.maintenance_date,
        notes: validatedData.notes,
      },
    })

    return { success: true, data: { ...log, price: Number(log.price) } }
  } catch (error) {
    console.error('Error creating maintenance log:', error)
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create maintenance log' }
  }
}

export async function deleteMaintenanceLog(id: string) {
  try {
    await prisma.maintenanceLog.delete({
      where: { id },
    })
    return { success: true }
  } catch (error) {
    console.error('Error deleting maintenance log:', error)
    return { success: false, error: 'Failed to delete maintenance log' }
  }
}
