import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-none border-b-2 border-border/30 bg-surface-low/50 px-4 py-2 text-base transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-primary focus-visible:bg-surface-low disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-bold",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
