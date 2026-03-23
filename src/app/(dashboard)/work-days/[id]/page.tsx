import { getWorkDay } from '@/actions/work-days'
import { notFound } from 'next/navigation'
import { formatCurrency } from '@/lib/format'
import { formatDateShort } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Users, Tractor, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { AddDailyBookingDialog } from '@/components/work-days/add-daily-booking-dialog'
import { AddDailyMachineDialog } from '@/components/work-days/add-daily-machine-dialog'
import { removeDailyBooking, removeDailyMachine } from '@/actions/work-days'
import { DeleteDailyItemButton } from '@/components/work-days/delete-daily-item-button'
import { EditDailyBookingAmount } from '@/components/work-days/edit-daily-booking-amount'
import { EditDailyMachineAmount } from '@/components/work-days/edit-daily-machine-amount'

interface Props {
  params: Promise<{ id: string }>
}

export default async function WorkDayDetailPage({ params }: Props) {
  const { id } = await params
  const workDay = await getWorkDay(id)

  if (!workDay) notFound()

  const totalBookingAmount = workDay.daily_bookings.reduce(
    (s, b) => s + Number(b.amount ?? 0),
    0
  )
  const totalMachineAmount = workDay.daily_machines.reduce(
    (s, m) => s + Number(m.amount ?? 0),
    0
  )
  const diff = totalBookingAmount - totalMachineAmount
  const balanced = Math.abs(diff) < 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Ngày làm việc — {formatDateShort(workDay.date)}
          </h1>
          {workDay.notes && (
            <p className="text-muted-foreground mt-1">{workDay.notes}</p>
          )}
        </div>
        <div className="flex gap-2">
          <AddDailyBookingDialog workDayId={workDay.id} />
          <AddDailyMachineDialog workDayId={workDay.id} />
        </div>
      </div>

      {/* Balance indicator */}
      <Card className={balanced ? 'border-green-500' : 'border-red-500'}>
        <CardContent className="flex items-center gap-4 py-4">
          {balanced ? (
            <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-red-600 shrink-0" />
          )}
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Tổng booking</div>
              <div className="font-semibold">{formatCurrency(totalBookingAmount)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tổng máy</div>
              <div className="font-semibold">{formatCurrency(totalMachineAmount)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Chênh lệch</div>
              <div
                className={`font-semibold ${
                  balanced ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {balanced ? 'Cân bằng' : formatCurrency(Math.abs(diff))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Bookings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Bookings ({workDay.daily_bookings.length})
            </h2>
          </div>

          {workDay.daily_bookings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Chưa có booking nào trong ngày này
              </CardContent>
            </Card>
          ) : (
            workDay.daily_bookings.map((db) => (
              <Card key={db.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {db.booking.customer.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <EditDailyBookingAmount
                        dailyBookingId={db.id}
                        currentAmount={db.amount ? Number(db.amount) : null}
                      />
                      <DeleteDailyItemButton
                        id={db.id}
                        onDelete={removeDailyBooking.bind(null, workDay.id)}
                      />
                    </div>
                  </div>
                  {db.booking.land && (
                    <p className="text-xs text-muted-foreground">
                      {db.booking.land.name}
                    </p>
                  )}
                </CardHeader>
                {db.machines.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground">
                      Máy liên kết:{' '}
                      {db.machines
                        .map((m) => m.daily_machine.machine.name)
                        .join(', ')}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Daily Machines */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tractor className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              Máy móc ({workDay.daily_machines.length})
            </h2>
          </div>

          {workDay.daily_machines.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                Chưa có máy nào trong ngày này
              </CardContent>
            </Card>
          ) : (
            workDay.daily_machines.map((dm) => (
              <Card key={dm.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {dm.machine.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {dm.machine.machine_type.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <EditDailyMachineAmount
                        dailyMachineId={dm.id}
                        currentAmount={dm.amount ? Number(dm.amount) : null}
                      />
                      <DeleteDailyItemButton
                        id={dm.id}
                        onDelete={removeDailyMachine.bind(null, workDay.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                {dm.workers.length > 0 && (
                  <CardContent className="pt-0 space-y-1">
                    <Separator className="mb-2" />
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <Users className="h-3 w-3" />
                      <span>Workers</span>
                    </div>
                    {dm.workers.map((w) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-medium">{w.worker.name}</span>
                          <Badge variant="outline" className="ml-2 text-xs py-0">
                            {w.job_type.name}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">
                          x{Number(w.applied_weight).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                )}
                {dm.bookings.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground">
                      Bookings liên kết:{' '}
                      {dm.bookings
                        .map((b) => b.daily_booking.booking.customer.name)
                        .join(', ')}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
