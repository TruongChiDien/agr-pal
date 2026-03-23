"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUpdateMachine } from "@/hooks/use-machines"
import { useMachineTypes } from "@/hooks/use-machine-types"
import { updateMachineSchema } from "@/schemas/machine"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/forms/date-picker"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"
import { MachineStatus } from "@/types/enums"
import type { Machine } from "@prisma/client"

type UpdateMachineInput = z.infer<typeof updateMachineSchema>

interface UpdateMachineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  machine: Machine
}

export function UpdateMachineDialog({ open, onOpenChange, machine }: UpdateMachineDialogProps) {
  const updateMachine = useUpdateMachine()
  const { data: machineTypes, isLoading: isTypesLoading } = useMachineTypes()
  const { toast } = useToast()

  const form = useForm<UpdateMachineInput>({
    resolver: zodResolver(updateMachineSchema),
    defaultValues: {
      name: "",
      model: "",
      machine_type_id: "",
      purchase_date: undefined,
      status: MachineStatus.Available,
    },
  })

  // Pre-fill form when machine data loads
  useEffect(() => {
    if (machine) {
      form.reset({
        name: machine.name,
        model: machine.model || "",
        machine_type_id: machine.machine_type_id || "",
        purchase_date: machine.purchase_date ? new Date(machine.purchase_date) : undefined,
        status: machine.status as MachineStatus,
      })
    }
  }, [machine, form])

  const onSubmit = async (data: UpdateMachineInput) => {
    await updateMachine.mutateAsync(
      { id: machine.id, data },
      {
        onSuccess: (result) => {
           if (result.success) {
               toast({
                   title: "Thành công",
                   description: "Đã cập nhật máy",
               })
               onOpenChange(false)
           } else {
               toast({
                   title: "Lỗi",
                   description: result.error || "Có lỗi xảy ra",
                   variant: "destructive"
               })
           }
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa máy</DialogTitle>
          <DialogDescription>
             Cập nhật thông tin cho {machine.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên máy *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Máy cày Kubota" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: M7040"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="machine_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại máy *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isTypesLoading ? "Đang tải..." : "Chọn loại máy"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {machineTypes?.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
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
              name="purchase_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày mua</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      maxDate={new Date()}
                      placeholder="Chọn ngày mua"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trạng thái *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={MachineStatus.Available}>Sẵn sàng</SelectItem>
                      <SelectItem value={MachineStatus.InUse}>Đang sử dụng</SelectItem>
                      <SelectItem value={MachineStatus.Maintenance}>Bảo trì</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                 type="button"
                 variant="outline"
                 onClick={() => onOpenChange(false)}
               >
                 Hủy
               </Button>
              <Button type="submit" disabled={updateMachine.isPending}>
                {updateMachine.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
