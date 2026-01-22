"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomers, useDeleteCustomer } from "@/hooks/use-customers";
import { PageContainer, ContentSection } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, ColumnDef } from "@/components/data-display/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/format";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Customer, Land, Bill } from "@/types";

type LandWithNumbers = Omit<Land, 'gps_lat' | 'gps_lng'> & {
  gps_lat: number | null;
  gps_lng: number | null;
};

type BillWithNumbers = Omit<Bill, 'total_amount' | 'total_paid' | 'discount_amount' | 'subtotal'> & {
  total_amount: number;
  total_paid: number;
  discount_amount: number;
  subtotal: number;
};

type CustomerWithRelations = Customer & {
  lands?: LandWithNumbers[];
  bills?: BillWithNumbers[];
};

export default function CustomersPage() {
  const router = useRouter();
  const { data: customers, isLoading } = useCustomers();
  const deleteCustomer = useDeleteCustomer();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
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

  const handleDeleteClick = (customerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomerToDelete(customerId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (customerToDelete) {
      await deleteCustomer.mutateAsync(customerToDelete);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  // Filter data by search query
  const filteredData = customers
    ? customers.filter((customer) =>
        customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Sort data
  const sortedData = filteredData.sort((a, b) => {
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
        ? aValue.localeCompare(bValue, "vi-VN")
        : bValue.localeCompare(aValue, "vi-VN");
    }

    return 0;
  });

  // Paginate data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const columns: ColumnDef<CustomerWithRelations>[] = [
    {
      key: "name",
      label: "Tên khách hàng",
      sortable: true,
      render: (item) => <span className="font-medium">{item.name}</span>,
    },
    {
      key: "phone",
      label: "Số điện thoại",
      sortable: true,
      width: "180px",
      render: (item) => (
        <span className="text-muted-foreground">{item.phone || "—"}</span>
      ),
    },
    {
      key: "lands",
      label: "Số thửa ruộng",
      align: "center",
      width: "140px",
      render: (item) => (
        <Badge variant="secondary">
          {item.lands?.length || 0} thửa
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Ngày tạo",
      width: "110px",
      sortable: true,
      render: (item) => (
        <span className="text-sm text-muted-foreground">{formatDateShort(item.created_at)}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      align: "right",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/customers/${item.id}/edit?redirect=${encodeURIComponent(`/customers/${item.id}`)}`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleDeleteClick(item.id, e)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <PageContainer>
        <ContentSection title="Khách hàng" description="Đang tải...">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </ContentSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentSection
        title="Khách hàng"
        description="Quản lý thông tin khách hàng và thửa ruộng"
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="pl-8 w-[250px]"
              />
            </div>
            <Button onClick={() => router.push("/customers/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm khách hàng
            </Button>
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={paginatedData}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={Math.ceil(sortedData.length / pageSize)}
          totalItems={sortedData.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          getRowId={(item) => item.id}
          onRowClick={(item) => router.push(`/customers/${item.id}`)}
        />
      </ContentSection>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
