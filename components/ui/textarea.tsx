import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-border/70 bg-background/40 px-3.5 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:border-ring/60 focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
