import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation active:scale-95",
          {
            "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950": variant === 'primary',
            "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100": variant === 'secondary',
            "text-gray-700 hover:bg-gray-100 active:bg-gray-200": variant === 'ghost',
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800": variant === 'destructive',
          },
          {
            "min-h-[44px] px-3 py-2 text-sm": size === 'sm',
            "min-h-[48px] px-4 py-2.5 text-sm md:text-base": size === 'md',
            "min-h-[52px] px-6 py-3 text-base md:text-lg": size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }