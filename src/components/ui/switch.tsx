"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { IconLoader2 } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

function Switch({
  className,
  loading,
  disabled,
  ...props
}: SwitchPrimitive.Root.Props & { loading?: boolean }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "peer inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-input dark:data-[unchecked]:bg-input/60",
        // keep the switch fully visible while loading (not dimmed like a plain disabled)
        loading && "cursor-progress opacity-100 disabled:opacity-100",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none flex size-3.5 items-center justify-center rounded-full bg-background shadow-sm ring-0 transition-transform data-[checked]:translate-x-[14px] data-[unchecked]:translate-x-0.5"
      >
        {loading && (
          <IconLoader2 className="size-2.5 animate-spin text-muted-foreground" />
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
