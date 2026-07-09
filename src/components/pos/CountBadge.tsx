interface CountBadgeProps {
  count: number
  max?: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_MAP = {
  sm: { minWidth: '18px', height: '18px', fontSize: '0.6rem', padding: '0 4px' },
  md: { minWidth: '22px', height: '22px', fontSize: '0.7rem', padding: '0 6px' },
  lg: { minWidth: '26px', height: '26px', fontSize: '0.8rem', padding: '0 8px' },
}

export default function CountBadge({
  count,
  max = 99,
  color = '#ef4444',
  size = 'md',
  className,
}: CountBadgeProps) {
  if (count <= 0) return null

  const display = count > max ? `${max}+` : String(count)
  const sizeStyle = SIZE_MAP[size]

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: sizeStyle.minWidth,
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        fontWeight: 800,
        color: '#fff',
        background: color,
        borderRadius: 'var(--pos-radius-full)',
        lineHeight: 1,
        textAlign: 'center' as const,
      }}
    >
      {display}
    </span>
  )
}
