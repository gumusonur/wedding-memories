import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-primary/15 before:to-transparent",
        "dark:before:via-primary/12",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:delay-1000",
        "after:bg-gradient-to-r after:from-transparent after:via-foreground/8 after:to-transparent",
        "dark:after:via-foreground/6",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }