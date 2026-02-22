"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface MultiSelectCheckboxProps<T> {
  items: T[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  renderItem: (item: T, isSelected: boolean, isDisabled: boolean) => React.ReactNode;
  getItemId: (item: T) => string;
  isItemDisabled?: (item: T) => boolean;
  disabledMessage?: string;
  className?: string;
  showSelectAll?: boolean;
  showSelectedCount?: boolean;
}

export function MultiSelectCheckbox<T>({
  items,
  selectedIds,
  onSelectionChange,
  renderItem,
  getItemId,
  isItemDisabled = () => false,
  disabledMessage = "Mục này không thể chọn",
  className,
  showSelectAll = true,
  showSelectedCount = true,
}: MultiSelectCheckboxProps<T>) {
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null);

  // Calculate enabled items
  const enabledItems = React.useMemo(
    () => items.filter((item) => !isItemDisabled(item)),
    [items, isItemDisabled]
  );

  const enabledItemIds = React.useMemo(
    () => enabledItems.map((item) => getItemId(item)),
    [enabledItems, getItemId]
  );

  // Check if all enabled items are selected
  const allSelected = React.useMemo(() => {
    if (enabledItemIds.length === 0) return false;
    return enabledItemIds.every((id) => selectedIds.includes(id));
  }, [enabledItemIds, selectedIds]);

  // Check if some (but not all) enabled items are selected
  const someSelected = React.useMemo(() => {
    return selectedIds.length > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all enabled items
      const newSelection = selectedIds.filter((id) => !enabledItemIds.includes(id));
      onSelectionChange(newSelection);
    } else {
      // Select all enabled items
      const newSelection = Array.from(new Set([...selectedIds, ...enabledItemIds]));
      onSelectionChange(newSelection);
    }
  };

  const handleSelectNone = () => {
    // Deselect all items (both enabled and disabled)
    onSelectionChange([]);
  };

  const handleToggle = (itemId: string, index: number, event: React.MouseEvent) => {
    const isCurrentlySelected = selectedIds.includes(itemId);

    // Handle Shift+Click for range selection
    if (event.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== index) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);

      // Get IDs in the range
      const rangeIds = items
        .slice(start, end + 1)
        .filter((item) => !isItemDisabled(item))
        .map((item) => getItemId(item));

      // Add range to selection
      const newSelection = Array.from(new Set([...selectedIds, ...rangeIds]));
      onSelectionChange(newSelection);
    } else {
      // Normal toggle
      if (isCurrentlySelected) {
        onSelectionChange(selectedIds.filter((id) => id !== itemId));
      } else {
        onSelectionChange([...selectedIds, itemId]);
      }
    }

    setLastSelectedIndex(index);
  };

  const selectedCount = selectedIds.length;
  const totalCount = items.length;
  const enabledCount = enabledItems.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with controls */}
      {(showSelectAll || showSelectedCount) && (
        <div className="flex items-center justify-between gap-4 pb-2 border-b">
          <div className="flex items-center gap-2">
            {showSelectAll && enabledCount > 0 && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Chọn tất cả"
                    className={cn(someSelected && "data-[state=checked]:bg-primary/50")}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer select-none"
                  >
                    {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </label>
                </div>
                {selectedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectNone}
                    className="h-8 text-xs"
                  >
                    Xóa
                  </Button>
                )}
              </>
            )}
          </div>

          {showSelectedCount && (
            <Badge variant="secondary" className="font-normal">
              Đã chọn {selectedCount} / {totalCount}
            </Badge>
          )}
        </div>
      )}

      {/* Items list */}
      <div className="space-y-2">
        {items.map((item, index) => {
          const itemId = getItemId(item);
          const isSelected = selectedIds.includes(itemId);
          const isDisabled = isItemDisabled(item);

          return (
            <div
              key={itemId}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                isSelected && !isDisabled && "border-primary bg-primary/5",
                isDisabled && "opacity-50 cursor-not-allowed bg-muted",
                !isDisabled && "cursor-pointer hover:bg-accent/50"
              )}
              onClick={(e) => {
                if (!isDisabled) {
                  handleToggle(itemId, index, e);
                }
              }}
              title={isDisabled ? disabledMessage : undefined}
            >
              <Checkbox
                id={`item-${itemId}`}
                checked={isSelected}
                disabled={isDisabled}
                onCheckedChange={() => {}}
                className="mt-1"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex-1 min-w-0">
                {renderItem(item, isSelected, isDisabled)}
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Không có dữ liệu
        </div>
      )}
    </div>
  );
}
