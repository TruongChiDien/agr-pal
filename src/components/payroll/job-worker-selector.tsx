'use client'

import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency, formatDateShort } from '@/lib/format'
import { listPendingDailyWorkers, listPayrollDailyWorkers } from '@/actions/workers'
import { cn } from '@/lib/utils'

interface JobWorkerSelectorProps {
  workerId: string
  selectedJobIds: string[]
  onSelectionChange: (jobIds: string[]) => void
  payrollId?: string
  isPaid?: boolean
  onLoaded?: (jobs: any[]) => void
}

export function JobWorkerSelector({
  workerId,
  selectedJobIds,
  onSelectionChange,
  payrollId,
  isPaid,
  onLoaded,
}: JobWorkerSelectorProps) {
  const [jobs, setJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true)
      try {
        const pendingJobs = await listPendingDailyWorkers(workerId)
        let currentJobs: any[] = []
        
        if (payrollId) {
          currentJobs = await listPayrollDailyWorkers(payrollId)
        }

        // Combine and add final_pay calc for the preview
        const combined = [...currentJobs, ...pendingJobs].map(job => ({
          ...job,
          final_pay: (Number(job.applied_base) * Number(job.applied_weight)) + Number(job.payment_adjustment || 0)
        }))

        // Deduplicate just in case
        const seen = new Set()
        const unique = combined.filter(j => {
          if (seen.has(j.id)) return false
          seen.add(j.id)
          return true
        })

        setJobs(unique)
        onLoaded?.(unique)
      } catch (error) {
        console.error('Failed to fetch daily workers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [workerId, payrollId, onLoaded])

  const handleToggle = (jobId: string) => {
    if (isPaid) return
    if (selectedJobIds.includes(jobId)) {
      onSelectionChange(selectedJobIds.filter((id) => id !== jobId))
    } else {
      onSelectionChange([...selectedJobIds, jobId])
    }
  }

  const handleSelectAll = () => {
    if (isPaid) return
    if (selectedJobIds.length === jobs.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(jobs.map((job) => job.id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full justify-center items-center p-4">
        <p className="text-sm text-muted-foreground animate-pulse">Đang tải công việc...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none p-4 pb-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold leading-none tracking-tight text-sm">Công việc héc/giờ</h3>
          {!isPaid && jobs.length > 0 && (
            <button
              type="button"
              className="text-xs text-primary hover:underline font-medium"
              onClick={handleSelectAll}
            >
              {selectedJobIds.length === jobs.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">Không có công việc nào chưa thanh toán</p>
          </div>
        ) : (
          <div className="space-y-1">
            {jobs.map((job) => {
              const isSelected = selectedJobIds.includes(job.id)
              return (
                <div
                  key={job.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-md transition-colors border border-transparent',
                    isSelected ? 'bg-primary/5 border-primary/10' : 'hover:bg-muted/50',
                    isPaid && 'opacity-80'
                  )}
                  onClick={() => handleToggle(job.id)}
                >
                  {!isPaid && (
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(job.id)}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <p className="text-xs font-medium truncate">
                        {job.daily_machine.machine.name} — {job.job_type.name}
                      </p>
                      <span className="text-xs font-semibold text-primary ml-2">
                        {formatCurrency(job.final_pay)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>{formatDateShort(job.daily_machine.work_day.date)}</span>
                      <span>
                        {formatCurrency(Number(job.applied_base))} x {Number(job.applied_weight)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
