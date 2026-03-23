"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreateMachineTypeDialog } from "./create-machine-type-dialog"

export function MachineTypesClient() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Tạo loại máy mới
      </Button>
      <CreateMachineTypeDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
