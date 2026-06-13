import type { LucideIcon } from 'lucide-react'

type PluginIconProps = {
  fallback: LucideIcon
  icon?: string
  label: string
  size?: 'md' | 'sm' | 'xs'
}

const sizeClasses = {
  md: 'size-11',
  sm: 'size-8',
  xs: 'size-7',
}

const fallbackSizes = {
  md: 22,
  sm: 16,
  xs: 14,
}

export function PluginIcon({ fallback: Fallback, icon, label, size = 'sm' }: PluginIconProps) {
  const wrapperSize = sizeClasses[size]
  const fallbackSize = fallbackSizes[size]

  return (
    <span
      className={`grid ${wrapperSize} flex-none place-items-center overflow-hidden rounded-[var(--dd-radius-sm)] border border-[var(--dd-border)] bg-[var(--dd-bg-elevated)] text-[var(--dd-accent)]`}
      aria-hidden="true"
    >
      {icon ? (
        <img alt="" className="size-full object-contain p-[var(--dd-space-1)]" src={icon} />
      ) : (
        <Fallback aria-label={`${label} icon`} size={fallbackSize} />
      )}
    </span>
  )
}
