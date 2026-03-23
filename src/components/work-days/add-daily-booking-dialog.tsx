'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { addDailyBookingSchema } from '@/schemas/work-day'
import { useBookings } from '@/hooks/use-bookings'
import { addDailyBooking } from '@/actions/work-days'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/format'

interface Props {
  workDayId: string
}

export function AddDailyBookingDialog({ workDayId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { data: bookings = [] } = useBookings()
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm({
    resolver: zodResolver(addDailyBookingSchema),
    defaultValues: {
      work_day_id: workDayId,
      booking_id: '',
      amount: 0,
      notes: '',
    },
  })

  async function onSubmit(values: any) {
    setLoading(true)
    try {
      const result = await addDailyBooking(workDayId, values.booking_id, values.amount)
      if (result.success) {
        setOpen(false)
        form.reset()
        toast({ title: 'Thêm booking thành công' })
        router.refresh()
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Đã xảy ra lỗi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm Booking vào ngày</DialogTitle>
          <DialogDescription>
            Chọn một booking hiện có để thêm vào ngày làm việc này.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="booking_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      const b = bookings.find((x) => x.id === val)
                      if (b) form.setValue('amount', Number(b.amount))
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn booking" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bookings
                        .filter((b) => b.payment_status === 'PENDING_BILL')
                        .map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.customer.name} — {formatCurrency(Number(b.amount))}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền tính cho ngày này</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Thêm'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
