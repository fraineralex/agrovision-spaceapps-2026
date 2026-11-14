/* shadcn/ui pattern (MIT). AI adaptation: Codex/OpenAI, 2026-11-14; Frainer review pending. */
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: { default: "bg-emerald-800 text-white hover:bg-emerald-900", outline: "border border-emerald-200 bg-white hover:bg-emerald-50" }, size: { default: "h-10 px-4 py-2", sm: "h-8 px-3 text-xs" } },
  defaultVariants: { variant: "default", size: "default" },
});
function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
export { Button, buttonVariants };
