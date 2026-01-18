'use server'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function listJobTypes() {
  await requireAuth()

  return await prisma.job_Type.findMany({
    orderBy: { name: 'asc' },
    include: { service: true },
  })
}
