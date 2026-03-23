"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useWorkDays } from "@/hooks/use-work-days"
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table"
import { PageContainer, ContentSection } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDateShort, formatCurrency } from "@/lib/format"
import { Plus } from "lucide-react"

type WorkDayRow = {
  id: string
  date: Date
  notes: string | null
  _count: { daily_bookings: number; daily_machines: number }
  daily_bookings: { amount: number | null }[]
  daily_machines: { amount: number | null }[]
}

export default function WorkDaysPage() {
  const router = useRouter()
  const { data: workDays = [], isLoading } = useWorkDays()

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const [sortKey, setSortKey] = useState("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("desc")

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const sorted = [...workDays].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0
    if (sortKey === "date") {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      return sortDirection === "asc" ? diff : -diff
    }
    return 0
  })

  const totalPages = Math.ceil(sorted.length / pageSize)
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const columns: ColumnDef<WorkDayRow>[] = [
    {
      key: "date",
      label: "Ngày",
      sortable: true,
      width: "130px",
      render: (item) => (
        <span className="font-medium">{formatDateShort(item.date)}</span>
      ),
    },
    {
      key: "balance",
      label: "Trạng thái",
      width: "120px",
      align: "center",
      render: (item) => {
        const totalB = item.daily_bookings.reduce((s, b) => s + Number(b.amount ?? 0), 0)
        const totalM = item.daily_machines.reduce((s, m) => s + Number(m.amount ?? 0), 0)
        const balanced = Math.abs(totalB - totalM) < 1
        return balanced ? (
          <Badge className="bg-green-600 text-white border-0">Cân bằng</Badge>
        ) : (
          <Badge variant="destructive">Chênh lệch</Badge>
        )
      },
    },
    {
      key: "bookings",
      label: "Bookings",
      width: "160px",
      render: (item) => {
        const total = item.daily_bookings.reduce((s, b) => s + Number(b.amount ?? 0), 0)
        return (
          <span className="text-sm">
            <span className="font-medium">{item._count.daily_bookings}</span>
            <span className="text-muted-foreground ml-1">({formatCurrency(total)})</span>
          </span>
        )
      },
    },
    {
      key: "machines",
      label: "Máy",
      width: "160px",
      render: (item) => {
        const total = item.daily_machines.reduce((s, m) => s + Number(m.amount ?? 0), 0)
        return (
          <span className="text-sm">
            <span className="font-medium">{item._count.daily_machines}</span>
            <span className="text-muted-foreground ml-1">({formatCurrency(total)})</span>
          </span>
        )
      },
    },
    {
      key: "diff",
      label: "Chênh lệch",
      width: "130px",
      align: "right",
      render: (item) => {
        const totalB = item.daily_bookings.reduce((s, b) => s + Number(b.amount ?? 0), 0)
        const totalM = item.daily_machines.reduce((s, m) => s + Number(m.amount ?? 0), 0)
        const diff = Math.abs(totalB - totalM)
        if (diff < 1) return <span className="text-muted-foreground text-xs">—</span>
        return <span className="text-red-600 text-sm font-medium">{formatCurrency(diff)}</span>
      },
    },
    {
      key: "notes",
      label: "Ghi chú",
      render: (item) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {item.notes || "—"}
        </span>
      ),
    },
  ]

  return (
    <PageContainer>
      <ContentSection
        title="Ngày làm việc"
        description="Quản lý bookings và máy móc theo từng ngày"
        actions={
          <Link href="/work-days/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm ngày
            </Button>
          </Link>
        }
      >
        <DataTable
          columns={columns}
          data={paginated as WorkDayRow[]}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={sorted.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1) }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={(item) => router.push(`/work-days/${item.id}`)}
          getRowId={(item) => item.id}
          isLoading={isLoading}
          emptyMessage="Chưa có ngày làm việc nào"
          emptyDescription="Bắt đầu bằng cách thêm ngày làm việc đầu tiên"
        />
      </ContentSection>
    </PageContainer>
  )
}
