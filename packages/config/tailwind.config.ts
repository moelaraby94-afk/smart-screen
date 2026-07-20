import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind config with DS V2 token mappings.
 * Apps should import this and spread it, adding their own `content` paths.
 *
 * The authoritative source for tokens is `globals.css` @theme inline block.
 * This config ensures IDE autocomplete and linting align with DS V2.
 */
export const sharedTailwindConfig = {
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          muted: 'hsl(var(--primary-muted))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        brand: {
          orange: '#FF6B00',
          navy: '#1B254B',
          primary: '#2563eb',
          surface: '#f9fafb',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
        arabic: 'var(--font-arabic)',
      },
      fontSize: {
        xs: ['var(--text-xs)', { lineHeight: '16px' }],
        sm: ['var(--text-sm)', { lineHeight: '20px' }],
        base: ['var(--text-base)', { lineHeight: '24px' }],
        lg: ['var(--text-lg)', { lineHeight: '28px' }],
        xl: ['var(--text-xl)', { lineHeight: '32px' }],
        '2xl': ['var(--text-2xl)', { lineHeight: '36px' }],
        '3xl': ['var(--text-3xl)', { lineHeight: '40px' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
      },
      zIndex: {
        base: 'var(--z-base)',
        content: 'var(--z-content)',
        card: 'var(--z-card)',
        sticky: 'var(--z-sticky)',
        header: 'var(--z-header)',
        sidebar: 'var(--z-sidebar)',
        toolbar: 'var(--z-toolbar)',
        'drawer-backdrop': 'var(--z-drawer-backdrop)',
        drawer: 'var(--z-drawer)',
        dropdown: 'var(--z-dropdown)',
        popover: 'var(--z-popover)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        command: 'var(--z-command)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
        debug: 'var(--z-debug)',
      },
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
        slower: 'var(--duration-slower)',
        slowest: 'var(--duration-slowest)',
      },
      transitionTimingFunction: {
        default: 'var(--ease-default)',
        'in': 'var(--ease-in)',
        out: 'var(--ease-out)',
        bounce: 'var(--ease-bounce)',
      },
    },
  },
} satisfies Config;

export default sharedTailwindConfig;
