import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-[#D4CFC3] dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] px-3.5 py-2.5 text-base sm:text-sm text-[#252821] dark:text-white placeholder:text-[#77786F]/70 dark:placeholder:text-[#94A3B8]/70 transition-colors focus:border-[#173B30] dark:focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#173B30]/15 disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-[#D4CFC3] dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] px-3.5 py-2.5 text-base sm:text-sm text-[#252821] dark:text-white placeholder:text-[#77786F]/70 dark:placeholder:text-[#94A3B8]/70 transition-colors focus:border-[#173B30] dark:focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#173B30]/15 disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-lg border border-[#D4CFC3] dark:border-[#333C52] bg-[#FFFEFA] dark:bg-[#1E2333] px-3.5 py-2.5 text-base sm:text-sm text-[#252821] dark:text-white transition-colors focus:border-[#173B30] dark:focus:border-[#34D399] focus:outline-none focus:ring-2 focus:ring-[#173B30]/15 disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function FieldLabel({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-[#252821] dark:text-white">
        {children}
        {required && <span className="ml-1 text-[#8F2424] dark:text-[#F87171]">*</span>}
      </label>
      {hint && <span className="text-xs text-[#77786F] dark:text-[#94A3B8]">{hint}</span>}
    </div>
  );
}

