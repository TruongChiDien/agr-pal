"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

export interface QuantityInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string; // e.g., "công", "kg", "hours"
  showButtons?: boolean; // Show +/- buttons (default: true on desktop)
}

export const QuantityInput = React.forwardRef<HTMLInputElement, QuantityInputProps>(
  (
    {
      className,
      value,
      onChange,
      min = 0,
      max,
      step = 1,
      unit,
      showButtons = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleIncrement = () => {
      const newValue = value + step;
      if (max === undefined || newValue <= max) {
        onChange(newValue);
      }
    };

    const handleDecrement = () => {
      const newValue = value - step;
      if (newValue >= min) {
        onChange(newValue);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty input for better UX
      if (inputValue === "") {
        onChange(min);
        return;
      }

      const parsed = parseFloat(inputValue);

      if (!isNaN(parsed)) {
        // Apply min/max constraints
        let constrained = parsed;
        if (constrained < min) {
          constrained = min;
        }
        if (max !== undefined && constrained > max) {
          constrained = max;
        }

        onChange(constrained);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Arrow keys for increment/decrement
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecrement();
      }
    };

    const canDecrement = value > min;
    const canIncrement = max === undefined || value < max;

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={disabled || !canDecrement}
            className="h-9 w-9 shrink-0"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}

        <div className="relative flex-1">
          <Input
            ref={ref}
            type="number"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn("text-center", unit && "pr-16")}
            {...props}
          />
          {unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              {unit}
            </span>
          )}
        </div>

        {showButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            disabled={disabled || !canIncrement}
            className="h-9 w-9 shrink-0"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

QuantityInput.displayName = "QuantityInput";
