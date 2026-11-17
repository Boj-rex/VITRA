import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "amber" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonVariantOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tactile?: boolean;
  className?: string;
}

export function buttonVariants({
  variant = "primary",
  size = "md",
  tactile = true,
  className,
}: ButtonVariantOptions = {}) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-bold select-none cursor-pointer font-tech",
    "transition-all duration-150 cubic-bezier(0.34, 1.56, 0.64, 1)",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:transform-none",
    tactile && [
      "hover:-translate-y-0.5 hover:scale-[1.01]",
      "active:translate-x-[2px] active:translate-y-[2px] active:scale-[0.98] active:shadow-none",
    ]
  );

  const variants: Record<ButtonVariant, string> = {
    primary: cn(
      "border-2 border-black dark:border-[#333C52] bg-[#173B30] text-white",
      "shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000000]",
      "hover:shadow-[4px_4px_0px_#111111] dark:hover:shadow-[4px_4px_0px_#10B981]",
      "hover:bg-[#1E4D3E] dark:hover:bg-[#10B981] dark:hover:text-[#0A0C12]"
    ),
    secondary: cn(
      "border-2 border-black dark:border-[#333C52] bg-[#F8D849] text-[#111111]",
      "shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000000]",
      "hover:shadow-[4px_4px_0px_#111111] dark:hover:shadow-[4px_4px_0px_#F59E0B]",
      "hover:bg-[#FACC15]"
    ),
    amber: cn(
      "border-2 border-black dark:border-[#333C52] bg-[#F59E0B] text-[#111111]",
      "shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000000]",
      "hover:shadow-[4px_4px_0px_#111111] dark:hover:shadow-[4px_4px_0px_#F59E0B]",
      "hover:bg-[#D97706] hover:text-white"
    ),
    dark: cn(
      "border-2 border-black dark:border-[#333C52] bg-[#111111] dark:bg-[#1A202C] text-white",
      "shadow-[3px_3px_0px_#1B3AFF] dark:shadow-[3px_3px_0px_#1B3AFF]",
      "hover:shadow-[4px_4px_0px_#1B3AFF]",
      "hover:bg-[#252821] dark:hover:bg-[#242A3D]"
    ),
    outline: cn(
      "border-2 border-[#111111] dark:border-[#333C52] bg-white dark:bg-[#1E2333] text-[#111111] dark:text-[#E2E8F0]",
      "shadow-[2px_2px_0px_#111111] dark:shadow-[2px_2px_0px_#000000]",
      "hover:shadow-[3px_3px_0px_#111111] dark:hover:shadow-[3px_3px_0px_#333C52]",
      "hover:bg-[#F6F3ED] dark:hover:bg-[#252D3F]"
    ),
    ghost: cn(
      "border-2 border-transparent text-[#252821] dark:text-[#E2E8F0]",
      "hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/10 dark:hover:border-white/10",
      "active:translate-y-0.5 active:scale-95"
    ),
    danger: cn(
      "border-2 border-black dark:border-[#333C52] bg-[#EF4444] text-white",
      "shadow-[3px_3px_0px_#111111] dark:shadow-[3px_3px_0px_#000000]",
      "hover:shadow-[4px_4px_0px_#111111] dark:hover:shadow-[4px_4px_0px_#EF4444]",
      "hover:bg-[#DC2626]"
    ),
  };

  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-xs sm:text-sm",
    lg: "h-12 px-6 text-sm sm:text-base",
  };

  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tactile?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      tactile = true,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonVariants({ variant, size, tactile, className })}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
