"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

export interface CommaSeparatedInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  value?: string[];
  onChange?: (values: string[]) => void;
}

/**
 * An Input designed specifically for array fields represented as comma-separated values.
 * Preserves in-progress typing (e.g. trailing commas, spaces) in local component state
 * while dispatching parsed string[] arrays to the parent onChange handler, preventing
 * the comma key or whitespace from being stripped during active keystrokes.
 */
export const CommaSeparatedInput = React.forwardRef<
  HTMLInputElement,
  CommaSeparatedInputProps
>(({ value = [], onChange, onBlur, onFocus, ...props }, ref) => {
  const [text, setText] = React.useState<string>(() => (value || []).join(", "));
  const isFocusedRef = React.useRef(false);

  // Sync from parent only when input is not actively focused/edited
  React.useEffect(() => {
    if (!isFocusedRef.current) {
      setText((value || []).join(", "));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextRaw = e.target.value;
    setText(nextRaw);
    const parsed = nextRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    onChange?.(parsed);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = true;
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    isFocusedRef.current = false;
    const parsed = text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setText(parsed.join(", "));
    onChange?.(parsed);
    onBlur?.(e);
  };

  return (
    <Input
      ref={ref}
      value={text}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
});

CommaSeparatedInput.displayName = "CommaSeparatedInput";
