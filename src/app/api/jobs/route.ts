import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const workerId = searchParams.get('worker_id')
    const paymentStatus = searchParams.get('payment_status')

    if (!workerId) {
      return NextResponse.json(
        { error: 'worker_id is required' },
        { status: 400 }
      )
    }

    const jobs = await prisma.job.findMany({
      where: {
        worker_id: workerId,
        ...(paymentStatus && { payment_status: paymentStatus }),
      },
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
      orderBy: {
        created_at: 'desc',
      },
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}
