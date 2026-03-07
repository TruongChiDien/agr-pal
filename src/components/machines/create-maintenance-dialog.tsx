'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { createMaintenanceLogSchema, CreateMaintenanceLogInput } from '@/schemas/machine-logs'
import { useMaintenanceCategories, useCreateMaintenanceLog } from '@/hooks/use-machine-logs'

interface CreateMaintenanceDialogProps {
  machineId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateMaintenanceDialog({
  machineId,
  open,
  onOpenChange,
}: CreateMaintenanceDialogProps) {
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const { data: categories = [] } = useMaintenanceCategories()
  const createLog = useCreateMaintenanceLog(machineId)

  const form = useForm<CreateMaintenanceLogInput>({
    resolver: zodResolver(createMaintenanceLogSchema),
    defaultValues: {
      machine_id: machineId,
      category_name: '',
      brand: '',
      price: undefined,
      quantity: undefined,
      maintenance_date: new Date(),
      notes: '',
    },
  })

  // Đặt lại form khi đóng dialog
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
      setSearchValue('')
    }
    onOpenChange(newOpen)
  }

  const onSubmit = async (data: CreateMaintenanceLogInput) => {
    await createLog.mutateAsync(data, {
      onSuccess: () => {
        handleOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm lịch sử bảo trì</DialogTitle>
          <DialogDescription>
            Ghi nhận thay nhớt hoặc phụ tùng mới cho máy.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_name"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Loại phụ tùng (*)</FormLabel>
                  <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={comboboxOpen}
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value || 'Chọn hoặc nhập loại mới...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Tìm hoặc nhập loại phụ tùng..."
                          value={searchValue}
                          onValueChange={setSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {searchValue ? (
                              <Button
                                variant="ghost"
                                className="w-full justify-start font-normal h-autop-2"
                                onClick={() => {
                                  field.onChange(searchValue)
                                  setComboboxOpen(false)
                                }}
                              >
                                Thêm mới: "{searchValue}"
                              </Button>
                            ) : (
                              'Không tìm thấy loại phụ tùng.'
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {categories.map((category: any) => (
                              <CommandItem
                                value={category.name}
                                key={category.id}
                                onSelect={(value: string) => {
                                  form.setValue('category_name', value)
                                  setComboboxOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    category.name === field.value
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {category.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hãng / Thương hiệu</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Castrol, Honda..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenance_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel>Ngày thực hiện (*)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full pl-3 text-left font-normal h-9',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
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
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={vi}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn giá (*)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng (*)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        min="1"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === "" ? undefined : Number(val));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ghi chú thêm (số giờ chạy, km, người thay...)"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createLog.isPending}>
                {createLog.isPending ? 'Đang lưu...' : 'Lưu lại'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
