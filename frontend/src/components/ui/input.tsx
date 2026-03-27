import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-xl border-2 border-black/10 bg-white px-4 py-2 text-sm font-mono ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus-visible:border-black",
        className
      )}
      {...props}
    />
  )
}

export { Input }
