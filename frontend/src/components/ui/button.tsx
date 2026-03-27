import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 font-mono font-bold uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "bg-black text-white hover:bg-black/90 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_rgba(0,0,0,0.1)]",
        outline:
          "border-2 border-black bg-white hover:bg-black hover:text-white shadow-[4px_4px_0px_rgba(0,0,0,0.1)] active:translate-y-[1px] active:shadow-[2px_2px_0px_rgba(0,0,0,0.1)]",
        secondary:
          "bg-black/5 text-black hover:bg-black/10 border-2 border-black/5",
        ghost: "hover:bg-black/5 text-black",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-[4px_4px_0px_rgba(239,68,68,0.2)]",
        link: "text-black underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4",
        lg: "h-13 rounded-2xl px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : ButtonPrimitive
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
