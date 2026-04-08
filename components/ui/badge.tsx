import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#3c89ff] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#3c89ff] text-white",
        secondary:
          "border-transparent bg-[#383838] text-gray-300",
        safe:
          "border-transparent bg-green-900/40 text-green-400 border-green-800",
        warning:
          "border-transparent bg-yellow-900/40 text-yellow-400 border-yellow-800",
        critical:
          "border-transparent bg-red-900/40 text-red-400 border-red-800",
        outline: "text-gray-300 border-[#383838]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
