'use server'

import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function listAdvancePayments() {
  await requireAuth()
  return await prisma.advance_Payment.findMany({
    include: {
      worker: true,
    },
    orderBy: { created_at: 'desc' },
  })
}
