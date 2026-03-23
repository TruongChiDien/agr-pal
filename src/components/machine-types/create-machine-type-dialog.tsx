"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2 } from "lucide-react"
import { useCreateMachineType } from "@/hooks/use-machine-types"
import { createMachineTypeSchema } from "@/schemas/machine-type"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Separator } from "@/components/ui/separator"

type CreateMachineTypeInput = z.infer<typeof createMachineTypeSchema>

interface CreateMachineTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateMachineTypeDialog({ open, onOpenChange }: CreateMachineTypeDialogProps) {
  const createMachineType = useCreateMachineType()

  const form = useForm<CreateMachineTypeInput>({
    resolver: zodResolver(createMachineTypeSchema),
    defaultValues: { name: "", description: "", job_types: [] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "job_types",
  })

  useEffect(() => {
    if (open) form.reset({ name: "", description: "", job_types: [] })
  }, [open, form])

  const onSubmit = async (data: CreateMachineTypeInput) => {
    const result = await createMachineType.mutateAsync(data)
    if (result.success) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo loại máy mới</DialogTitle>
          <DialogDescription>Định nghĩa loại máy và các loại công việc</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên loại máy *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Máy cắt lúa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả loại máy..."
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Job Types — inline creation, no Select dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-sm font-medium">Loại công việc</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", default_base_salary: 0 })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Thêm loại CV
                </Button>
              </div>

              {fields.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  Chưa có loại công việc nào. Nhấn &quot;Thêm loại CV&quot; để thêm.
                </p>
              )}

              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 p-2.5 border rounded-md bg-muted/20"
                  >
                    <FormField
                      control={form.control}
                      name={`job_types.${index}.name`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Tên CV (VD: Tài xế)" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`job_types.${index}.default_base_salary`}
                      render={({ field: f }) => (
                        <FormItem className="w-32">
                          <FormControl>
                            <CurrencyInput
                              value={f.value}
                              onChange={(v) => f.onChange(v ?? 0)}
                              placeholder="Lương"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-0.5"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createMachineType.isPending}>
                {createMachineType.isPending ? "Đang tạo..." : "Tạo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
