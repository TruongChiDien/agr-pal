"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCreateService } from "@/hooks/use-services"
import { useMachineTypes } from "@/hooks/use-machine-types"
import { createServiceSchema } from "@/schemas/service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { CurrencyInput } from "@/components/forms/currency-input"

type CreateServiceInput = z.infer<typeof createServiceSchema>

interface CreateServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateServiceDialog({ open, onOpenChange }: CreateServiceDialogProps) {
  const createService = useCreateService()
  const { data: machineTypes = [] } = useMachineTypes()

  const form = useForm<CreateServiceInput>({
    resolver: zodResolver(createServiceSchema),
    defaultValues: { name: "", unit: "công", price: 0, description: "", machine_type_ids: [] },
  })

  useEffect(() => {
    if (open) form.reset({ name: "", unit: "công", price: 0, description: "", machine_type_ids: [] })
  }, [open, form])

  const onSubmit = async (data: CreateServiceInput) => {
    const result = await createService.mutateAsync(data)
    if (result.success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo dịch vụ mới</DialogTitle>
          <DialogDescription>Thêm dịch vụ nông nghiệp vào hệ thống</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên dịch vụ *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Cắt lúa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn vị *</FormLabel>
                    <FormControl>
                      <Input placeholder="công" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn giá *</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? 0)}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả dịch vụ..."
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {machineTypes.length > 0 && (
              <FormField
                control={form.control}
                name="machine_type_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại máy liên quan</FormLabel>
                    <div className="space-y-2">
                      {machineTypes.map((mt) => (
                        <div key={mt.id} className="flex items-center gap-2">
                          <Checkbox
                            id={mt.id}
                            checked={(field.value ?? []).includes(mt.id)}
                            onCheckedChange={(checked) => {
                              const vals = field.value ?? []
                              field.onChange(
                                checked ? [...vals, mt.id] : vals.filter((v) => v !== mt.id)
                              )
                            }}
                          />
                          <label htmlFor={mt.id} className="text-sm cursor-pointer">
                            {mt.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createService.isPending}>
                {createService.isPending ? "Đang tạo..." : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
