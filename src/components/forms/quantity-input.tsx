"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

export interface QuantityInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
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
      placeholder,
      ...props
    },
    ref
  ) => {
    // Internal display state: empty string when value is 0/undefined/null (placeholder mode)
    const [inputStr, setInputStr] = React.useState<string>(() => {
      if (value === undefined || value === null || value === 0) return "";
      return String(value);
    });
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync display when external value changes (e.g. form reset)
    React.useEffect(() => {
      if (!isFocused) {
        if (value === undefined || value === null || value === 0) {
          setInputStr("");
        } else {
          setInputStr(String(value));
        }
      }
    }, [value, isFocused]);

    const numericValue = value ?? 0;

    const handleIncrement = () => {
      const newValue = numericValue + step;
      if (max === undefined || newValue <= max) {
        onChange(newValue);
        setInputStr(String(newValue));
      }
    };

    const handleDecrement = () => {
      const newValue = numericValue - step;
      if (newValue > min) {
        onChange(newValue);
        setInputStr(String(newValue));
      } else if (newValue === min && min > 0) {
        onChange(newValue);
        setInputStr(String(newValue));
      } else if (newValue < min || newValue === 0) {
        // Allow clearing back to empty
        onChange(undefined);
        setInputStr("");
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputStr(raw);

      if (raw === "") {
        onChange(undefined);
        return;
      }

      const parsed = parseFloat(raw);
      if (!isNaN(parsed)) {
        let constrained = parsed;
        if (constrained < min) constrained = min;
        if (max !== undefined && constrained > max) constrained = max;
        onChange(constrained);
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Normalize display on blur
      if (inputStr !== "" && !isNaN(parseFloat(inputStr))) {
        const parsed = parseFloat(inputStr);
        if (parsed === 0) {
          // Treat 0 as empty (clear back to placeholder)
          onChange(undefined);
          setInputStr("");
        } else {
          setInputStr(String(parsed));
        }
      } else if (inputStr === "" || isNaN(parseFloat(inputStr))) {
        onChange(undefined);
        setInputStr("");
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecrement();
      }
    };

    const canDecrement = numericValue > min;
    const canIncrement = max === undefined || numericValue < max;

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
            value={inputStr}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder ?? "0"}
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
