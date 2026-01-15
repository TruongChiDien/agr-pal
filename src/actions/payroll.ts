'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createPayrollSchema } from '@/schemas/payroll'
import { JobPaymentStatus, AdvanceStatus } from '@/types/enums'
import type { Result } from '@/types/result'
import type { Payroll_Sheet } from '@prisma/client'

export async function createPayroll(input: unknown): Promise<Result<Payroll_Sheet>> {
  try {
    await requireAuth()
    const validated = createPayrollSchema.parse(input)

    // Validate job_workers
    const jobWorkers = await prisma.job_Worker.findMany({
      where: {
        id: { in: validated.job_worker_ids },
        worker_id: validated.worker_id,
        payment_status: JobPaymentStatus.PendingPayroll,
      },
    })

    if (jobWorkers.length !== validated.job_worker_ids.length) {
      return { success: false, error: 'Một số job worker đã có trong phiếu lương hoặc không hợp lệ' }
    }

    const total_wages = jobWorkers.reduce((sum, jw) => sum + Number(jw.final_pay), 0)

    // Validate advance payments if provided
    let total_adv = 0
    if (validated.advance_payment_ids && validated.advance_payment_ids.length > 0) {
      const advances = await prisma.advance_Payment.findMany({
        where: {
          id: { in: validated.advance_payment_ids },
          worker_id: validated.worker_id,
          status: AdvanceStatus.Unprocessed,
        },
      })

      if (advances.length !== validated.advance_payment_ids.length) {
        return { success: false, error: 'Một số tạm ứng đã được xử lý hoặc không hợp lệ' }
      }

      total_adv = advances.reduce((sum, adv) => sum + Number(adv.amount), 0)
    }

    const net_payable = total_wages - total_adv

    // Transaction: create payroll + update job_workers + update advances
    const payroll = await prisma.$transaction(async (tx) => {
      const newPayroll = await tx.payroll_Sheet.create({
        data: {
          worker_id: validated.worker_id,
          total_wages,
          total_adv,
          net_payable,
          total_paid: 0,
        },
      })

      await tx.job_Worker.updateMany({
        where: { id: { in: validated.job_worker_ids } },
        data: {
          payroll_id: newPayroll.id,
          payment_status: JobPaymentStatus.AddedPayroll,
        },
      })

      if (validated.advance_payment_ids && validated.advance_payment_ids.length > 0) {
        await tx.advance_Payment.updateMany({
          where: { id: { in: validated.advance_payment_ids } },
          data: {
            payroll_id: newPayroll.id,
            status: AdvanceStatus.Processed,
          },
        })
      }

      return newPayroll
    })

    revalidatePath('/dashboard/payroll')
    revalidatePath('/dashboard/jobs')
    return { success: true, data: payroll }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi tạo phiếu lương' }
  }
}

export async function listPayrolls() {
  await requireAuth()
  return await prisma.payroll_Sheet.findMany({
    include: {
      worker: true,
      job_workers: {
        include: {
          job: {
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
      },
      advance_payments: true,
    },
    orderBy: { created_at: 'desc' },
  })
}

export async function getPayroll(id: string) {
  await requireAuth()
  return await prisma.payroll_Sheet.findUnique({
    where: { id },
    include: {
      worker: true,
      job_workers: {
        include: {
          job: {
            include: {
              booking: {
                include: {
                  customer: true,
                  land: true,
                  service: true,
                },
              },
              job_type: true,
            },
          },
        },
      },
      advance_payments: true,
    },
  })
}

export async function deletePayroll(id: string): Promise<Result<void>> {
  try {
    await requireAuth()

    // Check payroll status (cannot delete if partially paid)
    const payroll = await prisma.payroll_Sheet.findUnique({
      where: { id },
      select: { status: true, total_paid: true },
    })

    if (!payroll) {
      return { success: false, error: 'Phiếu lương không tồn tại' }
    }

    if (Number(payroll.total_paid) > 0) {
      return { success: false, error: 'Không thể xóa phiếu lương đã có thanh toán' }
    }

    // Transaction: delete payroll + reset job_workers + reset advances
    await prisma.$transaction(async (tx) => {
      await tx.job_Worker.updateMany({
        where: { payroll_id: id },
        data: {
          payroll_id: null,
          payment_status: JobPaymentStatus.PendingPayroll,
        },
      })

      await tx.advance_Payment.updateMany({
        where: { payroll_id: id },
        data: {
          payroll_id: null,
          status: AdvanceStatus.Unprocessed,
        },
      })

      await tx.payroll_Sheet.delete({
        where: { id },
      })
    })

    revalidatePath('/dashboard/payroll')
    revalidatePath('/dashboard/jobs')
    return { success: true, data: undefined }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi xóa phiếu lương' }
  }
}
