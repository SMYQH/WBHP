import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cyan-500 text-slate-950 shadow-md hover:bg-cyan-400 hover:shadow-cyan-500/20 hover:shadow-lg font-semibold",
        destructive:
          "bg-red-500/80 text-white shadow-sm hover:bg-red-500 dark:bg-red-900/80 dark:hover:bg-red-800",
        outline:
          "border border-white/15 bg-slate-900/40 text-slate-100 backdrop-blur-md hover:border-cyan-400/50 hover:bg-white/10 hover:text-white",
        secondary:
          "bg-white/10 text-slate-100 backdrop-blur-md hover:bg-white/15 hover:text-white border border-white/10",
        ghost:
          "text-slate-200 hover:bg-white/10 hover:text-white",
        link:
          "text-cyan-400 underline-offset-4 hover:underline",
        "cyan-glow":
          "border border-cyan-500/40 bg-cyan-950/30 text-cyan-300 backdrop-blur-md shadow-[0_0_12px_rgba(34,211,238,0.15)] hover:border-cyan-400 hover:bg-cyan-900/40 hover:text-cyan-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
