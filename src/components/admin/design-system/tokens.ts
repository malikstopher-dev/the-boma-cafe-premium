// Design tokens for The Boma Café Admin Dashboard
// Based on MiniMax M3 redesign plan — Stripe/Linear/Vercel aesthetic

export const tokens = {
  colors: {
    // Light theme (admin pages)
    bg: {
      primary: '#FFFFFF',
      secondary: '#F8F9FB',
      tertiary: '#F1F3F7',
      inverse: '#0F172A',
    },
    surface: {
      default: '#FFFFFF',
      raised: '#FFFFFF',
      overlay: 'rgba(0,0,0,0.5)',
    },
    border: {
      default: '#E5E7EB',
      strong: '#D1D5DB',
      focus: '#0F766E',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      muted: '#94A3B8',
      inverse: '#FFFFFF',
      link: '#0F766E',
    },
    accent: {
      default: '#0F766E',
      hover: '#0D5C56',
      bg: '#ECFDF5',
      text: '#065F46',
    },
    success: {
      default: '#10B981',
      bg: '#ECFDF5',
      text: '#065F46',
    },
    warning: {
      default: '#F59E0B',
      bg: '#FFFBEB',
      text: '#92400E',
    },
    danger: {
      default: '#EF4444',
      bg: '#FEF2F2',
      text: '#991B1B',
    },
    info: {
      default: '#3B82F6',
      bg: '#EFF6FF',
      text: '#1E40AF',
    },
    // Station colors
    kitchen: '#10B981',
    bar: '#8B5CF6',
    waiter: '#F59E0B',
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'SF Mono', monospace",
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },

  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    lg: '0 8px 24px rgba(0,0,0,0.12)',
    xl: '0 16px 48px rgba(0,0,0,0.16)',
  },

  transition: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
  },

  zIndex: {
    card: 1,
    header: 10,
    sidebar: 100,
    modal: 200,
    toast: 300,
    tooltip: 400,
  },
} as const

export type ColorToken = keyof typeof tokens.colors
export type SpacingToken = keyof typeof tokens.spacing
