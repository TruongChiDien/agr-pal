import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const workerId = searchParams.get('worker_id')
    const status = searchParams.get('status')
    const includePayrollId = searchParams.get('include_payroll_id')
    
    if (!workerId) {
      return NextResponse.json(
        { error: 'worker_id is required' },
        { status: 400 }
      )
    }

    const whereClause: any = {
        worker_id: workerId,
    }

    if (status && includePayrollId) {
        whereClause.OR = [
            { status: status as any },
            { payroll_id: includePayrollId }
        ]
    } else if (status) {
        whereClause.status = status as any
    } else if (includePayrollId) {
        whereClause.payroll_id = includePayrollId
    }

    const advances = await prisma.advance_Payment.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json(advances)
  } catch (error) {
    console.error('Error fetching advances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch advances' },
      { status: 500 }
    )
  }
}
