'use client'

import { useBookings } from '@/hooks/use-bookings'
import { useServices } from '@/hooks/use-services'
import { useCustomers } from '@/hooks/use-customers'
import { useJobs } from '@/hooks/use-jobs'
import { useBills } from '@/hooks/use-bills'
import { usePayrolls } from '@/hooks/use-payroll'
import { useMachines } from '@/hooks/use-machines'
import { useWorkers } from '@/hooks/use-workers'
import { SkeletonTable } from '@/components/ui/skeleton-table'

export default function TestHooksPage() {
  const bookings = useBookings()
  const services = useServices()
  const customers = useCustomers()
  const jobs = useJobs()
  const bills = useBills()
  const payrolls = usePayrolls()
  const machines = useMachines()
  const workers = useWorkers()

  const hooks = [
    { name: 'Bookings', hook: bookings },
    { name: 'Services', hook: services },
    { name: 'Customers', hook: customers },
    { name: 'Jobs', hook: jobs },
    { name: 'Bills', hook: bills },
    { name: 'Payrolls', hook: payrolls },
    { name: 'Machines', hook: machines },
    { name: 'Workers', hook: workers },
  ]

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Hooks Test Page</h1>
      <p className="text-muted-foreground">
        Testing all query hooks with loading and error states
      </p>

      <div className="grid gap-6">
        {hooks.map(({ name, hook }) => (
          <div key={name} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{name}</h2>

            {hook.isLoading && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">Loading...</p>
                <SkeletonTable rows={3} columns={3} />
              </div>
            )}

            {hook.error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                <p className="font-semibold">Error:</p>
                <p className="text-sm">{(hook.error as Error).message}</p>
              </div>
            )}

            {hook.isSuccess && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <p className="text-sm text-muted-foreground">
                    Loaded {Array.isArray(hook.data) ? hook.data.length : 0} items
                  </p>
                </div>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-40">
                  {JSON.stringify(hook.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
