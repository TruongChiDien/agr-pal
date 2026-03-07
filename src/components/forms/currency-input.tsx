"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency, parseCurrency } from "@/lib/format";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  incrementStep?: number; // For arrow key increment/decrement
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, min = 0, max, incrementStep = 1000, disabled, placeholder, ...props }, ref) => {
    const numericValue = value ?? 0;

    // Internal display state: empty when value is 0/undefined/null
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      if (value === undefined || value === null || value === 0) return "";
      return formatCurrency(value, false);
    });
    const [isFocused, setIsFocused] = React.useState(false);

    // Update display value when value prop changes (e.g. form reset)
    React.useEffect(() => {
      if (!isFocused) {
        if (value === undefined || value === null || value === 0) {
          setDisplayValue("");
        } else {
          setDisplayValue(formatCurrency(value, false));
        }
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);

      if (inputValue === "") {
        onChange(undefined);
        return;
      }

      const parsed = parseCurrency(inputValue);

      // Apply min/max constraints
      let constrained = parsed;
      if (min !== undefined && constrained < min) {
        constrained = min;
      }
      if (max !== undefined && constrained > max) {
        constrained = max;
      }

      onChange(constrained);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Select all text on focus for easy replacement
      e.target.select();
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Re-format on blur, or clear if zero
      if (displayValue === "" || parseCurrency(displayValue) === 0) {
        onChange(undefined);
        setDisplayValue("");
      } else {
        setDisplayValue(formatCurrency(numericValue, false));
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Arrow keys for increment/decrement
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newValue = numericValue + incrementStep;
        if (max === undefined || newValue <= max) {
          onChange(newValue);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newValue = numericValue - incrementStep;
        if (newValue >= min) {
          onChange(newValue);
        }
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? "0"}
          className={cn("pr-8", className)}
          {...props}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          đ
        </span>
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
