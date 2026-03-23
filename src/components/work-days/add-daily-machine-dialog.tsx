'use client'

import { useState, useMemo } from 'react'
import { Plus, ArrowRight } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useMachines } from '@/hooks/use-machines'
import { useWorkers } from '@/hooks/use-workers'
import { addDailyMachine } from '@/actions/work-days'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/format'
import type { Job_Type } from '@prisma/client'

interface Props {
  workDayId: string
}

export function AddDailyMachineDialog({ workDayId }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Pick machine, 2: Assign workers

  const [machineId, setMachineId] = useState('')
  const [amount, setAmount] = useState(0)
  // assignments: job_type_id → worker_id
  const [assignments, setAssignments] = useState<Record<string, string>>({})

  const { data: machines = [] } = useMachines()
  const { data: workers = [] } = useWorkers()
  const router = useRouter()
  const { toast } = useToast()

  const selectedMachine = useMemo(
    () => machines.find((m) => m.id === machineId),
    [machines, machineId]
  )

  // Job types come directly from machine_type (no slots needed)
  type MachineTypeWithJobTypes = { job_types: Job_Type[] }
  const jobTypes: Job_Type[] =
    selectedMachine
      ? ((selectedMachine.machine_type as unknown as MachineTypeWithJobTypes).job_types ?? [])
      : []

  async function handleAdd() {
    setLoading(true)
    try {
      const assignmentArray = Object.entries(assignments)
        .filter(([, worker_id]) => worker_id !== '')
        .map(([job_type_id, worker_id]) => ({ job_type_id, worker_id }))

      const result = await addDailyMachine(workDayId, machineId, amount, assignmentArray)
      if (result.success) {
        setOpen(false)
        reset()
        toast({ title: 'Thêm máy thành công' })
        router.refresh()
      } else {
        toast({ title: 'Lỗi', description: result.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Lỗi', description: 'Đã xảy ra lỗi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep(1)
    setMachineId('')
    setAmount(0)
    setAssignments({})
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Máy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm Máy vào ngày</DialogTitle>
          <DialogDescription>
            Chọn máy và gán worker cho từng loại công việc.
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Máy</Label>
              <Select onValueChange={setMachineId} value={machineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn máy" />
                </SelectTrigger>
                <SelectContent>
                  {machines.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.machine_type.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Số tiền tính cho máy (tùy chọn)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <Button
              className="w-full"
              disabled={!machineId}
              onClick={() => setStep(2)}
            >
              Tiếp theo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Máy: {selectedMachine?.name}</span>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Thay đổi
              </Button>
            </div>
            <Separator />

            {jobTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Loại máy này chưa có loại công việc nào
              </p>
            ) : (
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {jobTypes.map((jt: Job_Type) => (
                  <div key={jt.id} className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {jt.name}
                      <span className="ml-1.5 font-normal normal-case text-muted-foreground">
                        ({formatCurrency(Number(jt.default_base_salary))}/ngày)
                      </span>
                    </Label>
                    <Select
                      onValueChange={(val) =>
                        setAssignments((prev) => ({ ...prev, [jt.id]: val }))
                      }
                      value={assignments[jt.id] || ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn worker (tùy chọn)" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers.map((w) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Quay lại
              </Button>
              <Button onClick={handleAdd} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? 'Đang thêm...' : 'Thêm Máy & Workers'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
