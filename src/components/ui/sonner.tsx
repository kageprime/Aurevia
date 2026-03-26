import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast border border-[#0B0B0D]/10 bg-[#F6F6F2] text-[#0B0B0D] rounded-none shadow-xl",
          title: "font-semibold tracking-tight",
          description: "text-[#6E6E73]",
          actionButton: "!bg-[var(--aurevia-accent)] !text-white !rounded-none",
          cancelButton: "!bg-transparent !text-[#0B0B0D] !border !border-[#0B0B0D]/20 !rounded-none",
          closeButton: "!bg-transparent !text-[#0B0B0D]",
          success: "!text-[#0B0B0D]",
          error: "!text-[#0B0B0D]",
          warning: "!text-[#0B0B0D]",
          info: "!text-[#0B0B0D]",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
