"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, X } from "lucide-react"
import { createJobTypeSchema } from "@/schemas/machine-type"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/forms/currency-input"

type JobTypeInput = z.infer<typeof createJobTypeSchema>

interface JobTypeInlineFormProps {
  initialData?: JobTypeInput
  onSave: (data: JobTypeInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function JobTypeInlineForm({
  initialData,
  onSave,
  onCancel,
  isLoading,
}: JobTypeInlineFormProps) {
  const form = useForm<JobTypeInput>({
    resolver: zodResolver(createJobTypeSchema),
    defaultValues: initialData ?? { name: "", default_base_salary: 0 },
  })

  useEffect(() => {
    if (initialData) form.reset(initialData)
  }, [initialData, form])

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data)
  })

  return (
    <div className="flex items-start gap-2 p-2.5 border rounded-md bg-muted/20">
      <div className="flex-1">
        <Input
          placeholder="Tên loại CV (VD: Tài xế)"
          className="h-8 text-sm"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="w-28">
        <CurrencyInput
          value={form.watch("default_base_salary")}
          onChange={(v) => form.setValue("default_base_salary", v ?? 0)}
          placeholder="Lương"
          className="h-8 text-sm"
        />
        {form.formState.errors.default_base_salary && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.default_base_salary.message}
          </p>
        )}
      </div>

      <div className="flex gap-1 mt-0.5">
        <Button
          type="button"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
