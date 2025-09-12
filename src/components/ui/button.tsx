import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative transform-gpu active:scale-95 active:translate-y-1",
  {
    variants: {
      variant: {
        default:
          "bg-gray-50 text-gray-900 border-2 border-gray-300 shadow-[0_4px_0_0_rgb(156,163,175)] hover:shadow-[0_2px_0_0_rgb(156,163,175)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(156,163,175)]",
        destructive:
          "bg-red-50 text-red-700 border-2 border-red-300 shadow-[0_4px_0_0_rgb(239,68,68)] hover:shadow-[0_2px_0_0_rgb(239,68,68)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(239,68,68)]",
        outline:
          "bg-white text-gray-700 border-2 border-gray-300 shadow-[0_4px_0_0_rgb(156,163,175)] hover:shadow-[0_2px_0_0_rgb(156,163,175)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(156,163,175)]",
        ghost:
          "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        link: "text-primary underline-offset-4 hover:underline",
        fun: "bg-yellow-100 text-yellow-800 border-2 border-yellow-400 shadow-[0_4px_0_0_rgb(251,191,36)] hover:shadow-[0_2px_0_0_rgb(251,191,36)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(251,191,36)] font-bold",
        primary:
          "bg-green-50 text-green-700 border-2 border-green-400 shadow-[0_4px_0_0_rgb(34,197,94)] hover:shadow-[0_2px_0_0_rgb(34,197,94)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(34,197,94)]",
        danger:
          "bg-red-50 text-red-700 border-2 border-red-400 shadow-[0_4px_0_0_rgb(239,68,68)] hover:shadow-[0_2px_0_0_rgb(239,68,68)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(239,68,68)]",
        secondary:
          "bg-gray-50 text-gray-700 border-2 border-gray-400 shadow-[0_4px_0_0_rgb(107,114,128)] hover:shadow-[0_2px_0_0_rgb(107,114,128)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(107,114,128)]",
        neutral:
          "bg-amber-50 text-amber-700 border-2 border-amber-400 shadow-[0_4px_0_0_rgb(245,158,11)] hover:shadow-[0_2px_0_0_rgb(245,158,11)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(245,158,11)] rounded-md h-full",
        phase:
          "bg-indigo-50 text-indigo-700 border-2 border-indigo-400 shadow-[0_4px_0_0_rgb(99,102,241)] hover:shadow-[0_2px_0_0_rgb(99,102,241)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(99,102,241)]",
        cta: "bg-emerald-50 text-emerald-700 border-2 border-emerald-400 shadow-[0_4px_0_0_rgb(16,185,129)] hover:shadow-[0_2px_0_0_rgb(16,185,129)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(16,185,129)]",
        share:
          "bg-teal-50 text-teal-700 border-2 border-teal-400 shadow-[0_4px_0_0_rgb(20,184,166)] hover:shadow-[0_2px_0_0_rgb(20,184,166)] hover:translate-y-0.5 active:shadow-[0_1px_0_0_rgb(20,184,166)] rounded-md h-full animate-pulse-gentle",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
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
