"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateDailyBooking } from "@/actions/daily-bookings"
import { useToast } from "@/hooks/use-toast"
import { Edit2, Check, X } from "lucide-react"

interface EditDailyBookingAmountProps {
  dailyBookingId: string
  currentAmount: number | null
}

export function EditDailyBookingAmount({
  dailyBookingId,
  currentAmount,
}: EditDailyBookingAmountProps) {
  const { toast } = useToast()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentAmount?.toString() ?? "")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    const amount = value === "" ? null : parseFloat(value)
    const result = await updateDailyBooking(dailyBookingId, { amount })
    if (result.success) {
      toast({ title: "Đã cập nhật số lượng" })
      setEditing(false)
    } else {
      toast({ title: "Lỗi", description: result.error, variant: "destructive" })
    }
    setLoading(false)
  }

  const handleEdit = () => {
    setValue(currentAmount?.toString() ?? "")
    setEditing(true)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-semibold text-sm">{currentAmount ?? "—"}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleEdit}>
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 w-20 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") setEditing(false)
        }}
      />
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={handleSave}
        disabled={loading}
      >
        <Check className="h-3 w-3 text-green-600" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0"
        onClick={() => setEditing(false)}
      >
        <X className="h-3 w-3 text-red-500" />
      </Button>
    </div>
  )
}
