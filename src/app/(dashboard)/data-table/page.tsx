"use client";

import { useState } from "react";
import { PageContainer, ContentSection } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, ColumnDef, SortDirection } from "@/components/data-display/data-table";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { LayoutGrid, LayoutList } from "lucide-react";

interface Booking {
  id: string;
  code: string;
  customerName: string;
  landName: string;
  serviceName: string;
  date: Date;
  amount: number;
  status: "New" | "In Progress" | "Completed" | "Blocked";
}

const sampleBookings: Booking[] = [
  {
    id: "1",
    code: "BK-001",
    customerName: "Nguyễn Văn A",
    landName: "Ruộng Đông",
    serviceName: "Cày ruộng",
    date: new Date(2026, 0, 10),
    amount: 5000000,
    status: "New",
  },
  {
    id: "2",
    code: "BK-002",
    customerName: "Trần Thị B",
    landName: "Ruộng Tây",
    serviceName: "Phun thuốc",
    date: new Date(2026, 0, 11),
    amount: 3500000,
    status: "In Progress",
  },
  {
    id: "3",
    code: "BK-003",
    customerName: "Lê Văn C",
    landName: "Ruộng Nam",
    serviceName: "Gặt lúa",
    date: new Date(2026, 0, 9),
    amount: 8000000,
    status: "Completed",
  },
  {
    id: "4",
    code: "BK-004",
    customerName: "Phạm Thị D",
    landName: "Ruộng Bắc",
    serviceName: "Bón phân",
    date: new Date(2026, 0, 12),
    amount: 2500000,
    status: "New",
  },
  {
    id: "5",
    code: "BK-005",
    customerName: "Hoàng Văn E",
    landName: "Ruộng Trung",
    serviceName: "Cày ruộng",
    date: new Date(2026, 0, 8),
    amount: 4200000,
    status: "Blocked",
  },
  {
    id: "6",
    code: "BK-006",
    customerName: "Vũ Thị F",
    landName: "Ruộng Xa",
    serviceName: "Phun thuốc",
    date: new Date(2026, 0, 13),
    amount: 3000000,
    status: "New",
  },
  {
    id: "7",
    code: "BK-007",
    customerName: "Đặng Văn G",
    landName: "Ruộng Gần",
    serviceName: "Gặt lúa",
    date: new Date(2026, 0, 7),
    amount: 7500000,
    status: "Completed",
  },
  {
    id: "8",
    code: "BK-008",
    customerName: "Bùi Thị H",
    landName: "Ruộng Cao",
    serviceName: "Bón phân",
    date: new Date(2026, 0, 14),
    amount: 2800000,
    status: "In Progress",
  },
];

const statusConfig = {
  New: { bg: "bg-blue-100", text: "text-blue-700", label: "Mới" },
  "In Progress": { bg: "bg-orange-100", text: "text-orange-700", label: "Đang thực hiện" },
  Completed: { bg: "bg-green-100", text: "text-green-700", label: "Hoàn thành" },
  Blocked: { bg: "bg-gray-100", text: "text-gray-700", label: "Tạm dừng" },
};

export default function DataTablePage() {
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Handle sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Cycle through: asc -> desc -> null -> asc
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey("");
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Sort data
  const sortedData = [...sampleBookings].sort((a, b) => {
    if (!sortKey || !sortDirection) return 0;

    const aValue = (a as any)[sortKey];
    const bValue = (b as any)[sortKey];

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // Paginate data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Define columns
  const columns: ColumnDef<Booking>[] = [
    {
      key: "code",
      label: "Mã đơn",
      sortable: true,
      width: "120px",
      render: (item) => <span className="font-mono font-medium">{item.code}</span>,
    },
    {
      key: "customerName",
      label: "Khách hàng",
      sortable: true,
    },
    {
      key: "landName",
      label: "Ruộng",
      sortable: true,
    },
    {
      key: "serviceName",
      label: "Dịch vụ",
      sortable: true,
    },
    {
      key: "date",
      label: "Ngày",
      sortable: true,
      width: "120px",
      render: (item) => formatDateShort(item.date),
    },
    {
      key: "amount",
      label: "Giá trị",
      sortable: true,
      align: "right",
      width: "150px",
      render: (item) => (
        <span className="font-medium">{formatCurrency(item.amount)}</span>
      ),
    },
    {
      key: "status",
      label: "Trạng thái",
      sortable: true,
      width: "150px",
      align: "center",
      render: (item) => {
        const config = statusConfig[item.status];
        return (
          <Badge className={`${config.bg} ${config.text} border-0`}>
            {config.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <ContentSection
        title="Data Table Demo"
        description="Reusable data table with sorting, pagination, and card view"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <LayoutList className="h-4 w-4 mr-2" />
              Table
            </Button>
            <Button
              variant={viewMode === "card" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("card")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Card
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={paginatedData}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={Math.ceil(sampleBookings.length / pageSize)}
          totalItems={sampleBookings.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          viewMode={viewMode}
          onRowClick={(item) => alert(`Clicked: ${item.code}`)}
          getRowId={(item) => item.id}
          renderCard={(item) => (
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-mono">{item.code}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDateShort(item.date)}
                    </p>
                  </div>
                  <Badge
                    className={`${statusConfig[item.status].bg} ${statusConfig[item.status].text} border-0`}
                  >
                    {statusConfig[item.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{item.customerName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Ruộng</p>
                    <p className="text-sm font-medium">{item.landName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dịch vụ</p>
                    <p className="text-sm font-medium">{item.serviceName}</p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Giá trị</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        />
      </ContentSection>

      {/* Features showcase */}
      <ContentSection title="Features" description="Data table capabilities">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sorting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click column headers to sort data. Cycles through ascending, descending, and
                no sort.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pagination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Navigate through pages with first, previous, next, and last buttons.
                Adjustable page size.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Card View</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Switch to card view for a more visual representation on desktop. Perfect for
                dashboards.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Row Click</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click any row (or card) to trigger custom actions. Hover states for better UX.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loading State</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Built-in skeleton loading states while data is being fetched.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Empty State</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Customizable empty state with icon, message, and description.
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </PageContainer>
  );
}
