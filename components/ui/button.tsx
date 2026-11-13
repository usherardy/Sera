import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent font-semibold leading-none whitespace-nowrap transition-[transform,background-color,border-color,color,box-shadow,filter] duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Dark gradient pill: the primary action */
        default:
          "bg-[linear-gradient(180deg,#3a3a3f_0%,#121214_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_-12px_rgba(20,30,80,0.55)] hover:brightness-125",
        ink: "bg-[linear-gradient(180deg,#3a3a3f_0%,#121214_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_-12px_rgba(20,30,80,0.55)] hover:brightness-125",
        /* White on dark surfaces */
        cream: "bg-white text-ink hover:bg-white/90",
        outline:
          "border-[rgba(20,30,80,0.12)] bg-white text-ink shadow-[0_1px_2px_rgba(20,30,80,0.05)] hover:border-[rgba(20,30,80,0.24)] aria-expanded:border-[rgba(20,30,80,0.24)]",
        secondary: "bg-secondary text-ink hover:bg-[#ebe5db]",
        ghost: "text-ink hover:bg-ink/[0.05] aria-expanded:bg-ink/[0.05]",
        destructive: "bg-error-bg text-pulse hover:bg-[#fad6d6] focus-visible:ring-pulse/20",
        link: "border-0 px-0 text-ink underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-11 gap-2 px-5 text-[0.9375rem]",
        sm: "h-9 gap-1.5 px-3.5 text-sm",
        xs: "h-7 gap-1 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
