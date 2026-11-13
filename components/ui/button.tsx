import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border-2 border-transparent font-semibold leading-none whitespace-nowrap transition-[transform,background-color,border-color,color] duration-200 outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Lavender fill + ink border: the signature primary button */
        default: "border-ink bg-dawn text-ink hover:bg-dawn-strong",
        /* Solid ink, for high-emphasis actions on cream */
        ink: "border-ink bg-ink text-cream hover:bg-ink/85",
        /* Cream on dark (teal) surfaces */
        cream: "border-cream bg-cream text-ink hover:bg-paper",
        outline:
          "border-cream-dark bg-paper text-ink hover:border-ink/40 aria-expanded:border-ink/40",
        secondary: "bg-secondary text-ink hover:bg-cream-dark/70",
        ghost: "text-ink hover:bg-ink/5 aria-expanded:bg-ink/5",
        destructive:
          "bg-error-bg text-pulse hover:bg-[#f3d3d3] focus-visible:ring-pulse/20",
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
