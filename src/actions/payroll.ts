'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createPayrollSchema } from '@/schemas/payroll'
import { addPayrollPaymentSchema } from '@/schemas/payment'
import { JobPaymentStatus, AdvanceStatus, PayrollStatus } from '@/types/enums'
import type { Result } from '@/types/result'
import type { Payroll_Sheet } from '@prisma/client'

export async function createPayroll(input: unknown): Promise<Result<Payroll_Sheet>> {
  try {
    await requireAuth()
    const validated = createPayrollSchema.parse(input)

    // Validate jobs (previously job_workers)
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: validated.job_ids },
        worker_id: validated.worker_id,
        payment_status: JobPaymentStatus.PendingPayroll,
      },
    })

    if (jobs.length !== validated.job_ids.length) {
      return { success: false, error: 'Một số công việc đã có trong phiếu lương hoặc không hợp lệ' }
    }

    const total_wages = jobs.reduce((sum: number, job: any) => sum + Number(job.final_pay), 0)

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

    const adjustment = validated.adjustment || 0
    const net_payable = total_wages - total_adv + adjustment

    // Transaction: create payroll + update jobs + update advances
    const payroll = (await prisma.$transaction(async (tx: any) => {
      const newPayroll = await tx.payroll_Sheet.create({
        data: {
          worker_id: validated.worker_id,
          total_wages,
          total_adv,
          adjustment,
          net_payable,
          total_paid: 0,
          notes: validated.notes || null,
        },
      })

      await tx.job.updateMany({
        where: { id: { in: validated.job_ids } },
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
    })) as Payroll_Sheet

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
      jobs: {
        include: {
          booking: {
            include: {
              customer: true,
              service: true,
            },
          },
          job_type: true,
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
        },
      },
      advance_payments: true,
      payments: {
        orderBy: {
          payment_date: 'desc',
        },
      },
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

    // Transaction: delete payroll + reset jobs + reset advances
    await prisma.$transaction(async (tx: any) => {
      await tx.job.updateMany({
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

export async function addPayrollPayment(input: unknown): Promise<Result<Payroll_Sheet>> {
  try {
    await requireAuth()
    const validated = addPayrollPaymentSchema.parse(input)

    // Get current payroll
    const payroll = await prisma.payroll_Sheet.findUnique({
      where: { id: validated.payroll_id },
    })

    if (!payroll) {
      return { success: false, error: 'Phiếu lương không tồn tại' }
    }

    const netPayable = Number(payroll.net_payable)
    const currentPaid = Number(payroll.total_paid)
    const remainingBalance = netPayable - currentPaid

    // Validate payment amount
    if (validated.amount > remainingBalance) {
      return {
        success: false,
        error: `Số tiền thanh toán (${validated.amount.toLocaleString('vi-VN')} đ) vượt quá số tiền còn lại (${remainingBalance.toLocaleString('vi-VN')} đ)`
      }
    }

    // Calculate new total_paid and status
    const newTotalPaid = currentPaid + validated.amount
    let newStatus = payroll.status

    if (newTotalPaid >= netPayable) {
      newStatus = PayrollStatus.Completed
    } else if (newTotalPaid > 0) {
      newStatus = PayrollStatus.PartialPaid
    }

    // Transaction: create payment record + update payroll
    const updatedPayroll = (await prisma.$transaction(async (tx: any) => {
      // Create payment record
      await tx.payroll_Payment.create({
        data: {
          payroll_id: validated.payroll_id,
          amount: validated.amount,
          payment_date: validated.payment_date,
          method: validated.method,
          notes: validated.notes || null,
        },
      })

      // Update payroll
      const updated = await tx.payroll_Sheet.update({
        where: { id: validated.payroll_id },
        data: {
          total_paid: newTotalPaid,
          status: newStatus,
        },
      })

      // If payroll completed, update job payment status
      if (newStatus === PayrollStatus.Completed) {
        await tx.job.updateMany({
          where: { payroll_id: validated.payroll_id },
          data: {
            payment_status: JobPaymentStatus.FullyPaid,
          },
        })
      }

      return updated
    })) as Payroll_Sheet

    revalidatePath('/dashboard/payroll')
    revalidatePath(`/dashboard/payroll/${validated.payroll_id}`)
    revalidatePath('/dashboard/jobs')
    return { success: true, data: updatedPayroll }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Đã xảy ra lỗi khi thêm thanh toán' }
  }
}

export async function updatePayroll(input: unknown): Promise<Result<Payroll_Sheet>> {
  try {
    await requireAuth()
    
    const { id, ...data } = input as any
    if (!id) return { success: false, error: 'Thiếu Payoll ID' }
    
    // Validate payload
    const validatedData = createPayrollSchema.parse(data)
    
    const existingPayroll = await prisma.payroll_Sheet.findUnique({ where: { id } })
    if(!existingPayroll) return { success: false, error: 'Phiếu lương không xác định' }
    
    // Check if paid
    if (Number(existingPayroll.total_paid) > 0) {
        // Only update notes
        await prisma.payroll_Sheet.update({
            where: { id },
            data: { notes: validatedData.notes || null }
        })
        revalidatePath('/dashboard/payroll')
        revalidatePath(`/dashboard/payroll/${id}`)
        return { success: true, data: existingPayroll }
    }

    // Not paid -> Full Update
    await prisma.$transaction(async (tx: any) => {
        // Disconnect all
        await tx.job.updateMany({
            where: { payroll_id: id },
            data: { payroll_id: null, payment_status: JobPaymentStatus.PendingPayroll }
        })
        await tx.advance_Payment.updateMany({
            where: { payroll_id: id },
            data: { payroll_id: null, status: AdvanceStatus.Unprocessed }
        })
        
        // Re-connect
        const jobs = await tx.job.findMany({
            where: {
                id: { in: validatedData.job_ids },
                worker_id: validatedData.worker_id,
                payment_status: JobPaymentStatus.PendingPayroll
            }
        })
        
        if (jobs.length !== validatedData.job_ids.length) throw new Error("Một số công việc không hợp lệ hoặc đã được thanh toán")
            
        const total_wages = jobs.reduce((sum: number, job: any) => sum + Number(job.final_pay), 0)
        
        let total_adv = 0
        if (validatedData.advance_payment_ids?.length) {
             const advances = await tx.advance_Payment.findMany({
                where: {
                    id: { in: validatedData.advance_payment_ids },
                    worker_id: validatedData.worker_id,
                    status: AdvanceStatus.Unprocessed
                }
            })
            if (advances.length !== validatedData.advance_payment_ids.length) throw new Error("Một số tạm ứng không hợp lệ")
            total_adv = advances.reduce((sum: number, adv: any) => sum + Number(adv.amount), 0)
        }
        
        const adjustment = validatedData.adjustment || 0
        const net_payable = total_wages - total_adv + adjustment
        
        // Update Payroll
        await tx.payroll_Sheet.update({
            where: { id },
            data: {
                worker_id: validatedData.worker_id, // Ensure consistent?
                total_wages,
                total_adv,
                adjustment,
                net_payable,
                notes: validatedData.notes || null
            }
        })
        
        // Connect Jobs
        await tx.job.updateMany({
            where: { id: { in: validatedData.job_ids } },
            data: { payroll_id: id, payment_status: JobPaymentStatus.AddedPayroll }
        })
        
        // Connect Advances
        if (validatedData.advance_payment_ids?.length) {
             await tx.advance_Payment.updateMany({
                where: { id: { in: validatedData.advance_payment_ids } },
                data: { payroll_id: id, status: AdvanceStatus.Processed }
             })
        }
    })
    
    revalidatePath('/dashboard/payroll')
    revalidatePath(`/dashboard/payroll/${id}`)
    revalidatePath('/dashboard/jobs') // Needed if jobs changed
    
    const updated = await prisma.payroll_Sheet.findUnique({ where: { id } })
    return { success: true, data: updated as Payroll_Sheet }

  } catch (error) {
     return { success: false, error: error instanceof Error ? error.message : "Update failed" }
  }
}
