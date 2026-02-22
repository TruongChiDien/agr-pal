"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableEmpty } from "./data-table-empty";
import { DataTableHeader, SortDirection } from "./data-table-header";

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string; // e.g., "200px", "20%"
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];

  // Pagination
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  // Sorting
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;

  // Row interaction
  onRowClick?: (item: T) => void;
  getRowId?: (item: T) => string;

  // View options
  viewMode?: "table" | "card";
  onViewModeChange?: (mode: "table" | "card") => void;
  renderCard?: (item: T) => React.ReactNode;

  // State
  isLoading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;

  // Styling
  className?: string;
  containerClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  currentPage = 1,
  pageSize = 10,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
  sortKey,
  sortDirection,
  onSort,
  onRowClick,
  getRowId,
  viewMode = "table",
  onViewModeChange,
  renderCard,
  isLoading = false,
  emptyMessage,
  emptyDescription,
  emptyAction,
  className,
  containerClassName,
}: DataTableProps<T>) {
  const calculatedTotalPages = totalPages || Math.ceil((totalItems || data.length) / pageSize);
  const calculatedTotalItems = totalItems || data.length;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn("space-y-4", containerClassName)}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} style={{ width: column.width }}>
                    <Skeleton className="h-4 w-24" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: pageSize }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn("rounded-md border", containerClassName)}>
        <DataTableEmpty message={emptyMessage} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  // Card view
  if (viewMode === "card" && renderCard) {
    return (
      <div className={cn("space-y-4", containerClassName)}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item, index) => {
            const id = getRowId ? getRowId(item) : index.toString();
            return (
              <div
                key={id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  onRowClick && "cursor-pointer hover:shadow-md transition-shadow"
                )}
              >
                {renderCard(item)}
              </div>
            );
          })}
        </div>

        {onPageChange && calculatedTotalPages > 1 && (
          <DataTablePagination
            currentPage={currentPage}
            totalPages={calculatedTotalPages}
            pageSize={pageSize}
            totalItems={calculatedTotalItems}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}
      </div>
    );
  }

  // Table view
  return (
    <div className={cn("space-y-4", containerClassName)}>
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table className={className}>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    style={{ width: column.width }}
                    className={cn("bg-muted/50", column.className)}
                  >
                    <DataTableHeader
                      label={column.label}
                      sortable={column.sortable}
                      sortDirection={sortKey === column.key ? sortDirection : null}
                      onSort={
                        column.sortable && onSort
                          ? () => onSort(column.key)
                          : undefined
                      }
                      align={column.align}
                    />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, index) => {
                const id = getRowId ? getRowId(item) : index.toString();
                return (
                  <TableRow
                    key={id}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      onRowClick &&
                        "cursor-pointer hover:bg-accent/50 transition-colors"
                    )}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={cn(
                          "px-6",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right",
                          column.className
                        )}
                      >
                        {column.render
                          ? column.render(item)
                          : String((item as any)[column.key] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {onPageChange && calculatedTotalPages > 1 && (
        <DataTablePagination
          currentPage={currentPage}
          totalPages={calculatedTotalPages}
          pageSize={pageSize}
          totalItems={calculatedTotalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
