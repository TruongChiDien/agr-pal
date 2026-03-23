'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { createWorkDaySchema } from '@/schemas/work-day'
import { createWorkDay } from '@/actions/work-days'
import { PageContainer, ContentSection } from '@/components/layout'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function NewWorkDayPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    resolver: zodResolver(createWorkDaySchema),
    defaultValues: {
      date: undefined as Date | undefined,
      notes: '',
    },
  })

  async function onSubmit(values: any) {
    setLoading(true)
    try {
      const result = await createWorkDay(values)
      if (result.success) {
        toast({ title: 'Tạo ngày làm việc thành công' })
        router.push(`/work-days/${result.data.id}`)
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
    <PageContainer>
      <ContentSection
        title="Thêm ngày làm việc mới"
        description="Bắt đầu quản lý công việc cho một ngày làm việc."
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ngày làm việc</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value instanceof Date ? (
                            format(field.value, 'PPP', { locale: vi })
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value as Date}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ghi chú cho ngày làm việc này..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo ngày làm việc'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Form>
      </ContentSection>
    </PageContainer>
  )
}
