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
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gray-900 text-white hover:bg-gray-800": variant === 'primary',
            "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50": variant === 'secondary',
            "text-gray-700 hover:bg-gray-100": variant === 'ghost',
            "bg-red-600 text-white hover:bg-red-700": variant === 'destructive',
          },
          {
            "h-8 px-3 text-sm": size === 'sm',
            "h-10 px-4 text-sm": size === 'md',
            "h-12 px-6 text-base": size === 'lg',
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