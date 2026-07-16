# 44 — Design Tokens

> **Evidence basis:** `01-foundations.md` through `10-accessibility-rules.md`, `40-token-naming.md`, `product-architecture/17-product-rules.md` PR-45–PR-50

---

## 1. Complete Token Reference

This document is the **single source of truth** for all design tokens. Every token used in the Cloud-Screen design system is listed here.

---

## 2. Color Tokens

### 2.1 Primitive Colors

```css
:root {
  /* Blue (Primary) */
  --color-blue-50:  #eff6ff;
  --color-blue-100: #dbeafe;
  --color-blue-400: #60a5fa;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-blue-700: #1d4ed8;
  --color-blue-900: #1e3a8a;

  /* Gray */
  --color-gray-50:  #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Green (Success) */
  --color-green-500: #22c55e;
  --color-green-600: #16a34a;

  /* Red (Destructive) */
  --color-red-500: #ef4444;
  --color-red-600: #dc2626;

  /* Amber (Warning) */
  --color-amber-500: #f59e0b;
  --color-amber-600: #d97706;

  /* Base */
  --color-white: #ffffff;
  --color-black: #000000;
}
```

### 2.2 Semantic Colors (Light Theme)

```css
:root {
  --color-background: var(--color-gray-50);
  --color-foreground: var(--color-gray-900);
  --color-card: var(--color-white);
  --color-card-foreground: var(--color-gray-900);
  --color-muted: var(--color-gray-100);
  --color-muted-foreground: var(--color-gray-500);
  --color-border: var(--color-gray-200);
  --color-border-strong: var(--color-gray-300);
  --color-input: var(--color-gray-200);
  --color-ring: var(--color-blue-500);
  --color-primary: var(--color-blue-600);
  --color-primary-foreground: var(--color-white);
  --color-primary-muted: var(--color-blue-50);
  --color-secondary: var(--color-gray-100);
  --color-secondary-foreground: var(--color-gray-900);
  --color-destructive: var(--color-red-500);
  --color-destructive-foreground: var(--color-white);
  --color-success: var(--color-green-500);
  --color-success-foreground: var(--color-white);
  --color-warning: var(--color-amber-500);
  --color-warning-foreground: var(--color-white);
  --color-accent: var(--color-blue-50);
  --color-accent-foreground: var(--color-blue-700);
  --color-popover: var(--color-white);
  --color-popover-foreground: var(--color-gray-900);
}
```

### 2.3 Semantic Colors (Dark Theme)

```css
.dark {
  --color-background: #131316;
  --color-foreground: var(--color-gray-50);
  --color-card: #1a1a1e;
  --color-card-foreground: var(--color-gray-50);
  --color-muted: #1a1a1e;
  --color-muted-foreground: var(--color-gray-400);
  --color-border: #2a2a30;
  --color-border-strong: #3a3a42;
  --color-input: #2a2a30;
  --color-ring: var(--color-blue-400);
  --color-primary: var(--color-blue-500);
  --color-primary-foreground: var(--color-white);
  --color-primary-muted: var(--color-blue-900);
  --color-secondary: #2a2a30;
  --color-secondary-foreground: var(--color-gray-50);
  --color-destructive: var(--color-red-500);
  --color-destructive-foreground: var(--color-white);
  --color-success: var(--color-green-500);
  --color-success-foreground: var(--color-white);
  --color-warning: var(--color-amber-500);
  --color-warning-foreground: var(--color-white);
  --color-accent: var(--color-blue-900);
  --color-accent-foreground: var(--color-blue-400);
  --color-popover: #1a1a1e;
  --color-popover-foreground: var(--color-gray-50);
}
```

---

## 3. Spacing Tokens

```css
:root {
  --space-0:    0;
  --space-0.5:  2px;
  --space-1:    4px;
  --space-1.5:  6px;
  --space-2:    8px;
  --space-3:    12px;
  --space-4:    16px;
  --space-5:    20px;
  --space-6:    24px;
  --space-8:    32px;
  --space-10:   40px;
  --space-12:   48px;
  --space-16:   64px;
}
```

---

## 4. Typography Tokens

```css
:root {
  /* Font Families */
  --font-sans:   'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:   'JetBrains Mono', ui-monospace, monospace;
  --font-arabic: 'Cairo', 'Tajawal', system-ui, sans-serif;

  /* Font Sizes */
  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   20px;
  --text-2xl:  24px;
  --text-3xl:  30px;
  --text-4xl:  36px;

  /* Line Heights */
  --leading-xs:   16px;
  --leading-sm:   20px;
  --leading-base: 24px;
  --leading-lg:   28px;
  --leading-xl:   32px;
  --leading-2xl:  36px;
  --leading-3xl:  40px;

  /* Font Weights */
  --font-normal:   400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
}
```

---

## 5. Radius Tokens

```css
:root {
  --radius-none: 0;
  --radius-sm:   4px;
  --radius-md:   6px;
  --radius-lg:   8px;
  --radius-xl:   12px;
  --radius-2xl:  16px;
  --radius-full: 9999px;
}
```

---

## 6. Shadow Tokens

```css
:root {
  --shadow-none: none;
  --shadow-xs:   0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-sm:   0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1);
  --shadow-md:   0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
  --shadow-lg:   0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1);
  --shadow-xl:   0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
  --shadow-2xl:  0 25px 50px -12px rgba(0,0,0,0.25);
}
```

---

## 7. Opacity Tokens

```css
:root {
  --opacity-0:   0;
  --opacity-25:  0.25;
  --opacity-50:  0.5;
  --opacity-75:  0.75;
  --opacity-100: 1;
}
```

---

## 8. Z-Index Tokens

```css
:root {
  --z-base:     0;
  --z-sticky:   20;
  --z-dropdown: 30;
  --z-sidebar:  35;
  --z-overlay:  40;
  --z-modal:    50;
  --z-toast:    60;
  --z-tooltip:  70;
}
```

---

## 9. Border Tokens

```css
:root {
  --border-width-thin:   1px;
  --border-width-medium: 2px;
  --border-width-thick:  4px;
}
```

---

## 10. Motion Tokens

```css
:root {
  /* Duration */
  --duration-instant:  0ms;
  --duration-fast:     150ms;
  --duration-normal:   200ms;
  --duration-slow:     300ms;
  --duration-slower:   400ms;
  --duration-slowest:  600ms;

  /* Easing */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce:  cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Delay */
  --delay-none:   0ms;
  --delay-short:  50ms;
  --delay-medium: 100ms;
}
```

---

## 11. Icon Size Tokens

```css
:root {
  --icon-xs:  14px;
  --icon-sm:  16px;
  --icon-md:  18px;
  --icon-lg:  20px;
  --icon-xl:  24px;
  --icon-2xl: 32px;
  --icon-3xl: 48px;
}
```

---

## 12. Container Tokens

```css
:root {
  --container-sm:  640px;
  --container-md:  768px;
  --container-lg:  1024px;
  --container-xl:  1200px;
  --container-2xl: 1400px;
  --container-full: 100%;
}
```

---

## 13. Tailwind Configuration Mapping

The design tokens map to Tailwind CSS configuration:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: { DEFAULT: 'var(--color-card)', foreground: 'var(--color-card-foreground)' },
        muted: { DEFAULT: 'var(--color-muted)', foreground: 'var(--color-muted-foreground)' },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        primary: { DEFAULT: 'var(--color-primary)', foreground: 'var(--color-primary-foreground)' },
        secondary: { DEFAULT: 'var(--color-secondary)', foreground: 'var(--color-secondary-foreground)' },
        destructive: { DEFAULT: 'var(--color-destructive)', foreground: 'var(--color-destructive-foreground)' },
        success: { DEFAULT: 'var(--color-success)', foreground: 'var(--color-success-foreground)' },
        warning: { DEFAULT: 'var(--color-warning)', foreground: 'var(--color-warning-foreground)' },
        accent: { DEFAULT: 'var(--color-accent)', foreground: 'var(--color-accent-foreground)' },
        popover: { DEFAULT: 'var(--color-popover)', foreground: 'var(--color-popover-foreground)' },
      },
      spacing: {
        0.5: '2px', 1.5: '6px', 13: '52px',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
        arabic: 'var(--font-arabic)',
      },
      fontSize: {
        xs: ['var(--text-xs)', { lineHeight: 'var(--leading-xs)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--leading-sm)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-base)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--leading-lg)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--leading-xl)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-2xl)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-3xl)' }],
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
        dropdown: 'var(--z-dropdown)',
        sidebar: 'var(--z-sidebar)',
        overlay: 'var(--z-overlay)',
        modal: 'var(--z-modal)',
        toast: 'var(--z-toast)',
        tooltip: 'var(--z-tooltip)',
      },
    },
  },
};
```

---

## 14. Token Usage Rules

1. **Always use tokens** — never hardcode values in components
2. **Semantic over primitive** — use `--color-primary`, not `--color-blue-600`
3. **One source of truth** — this document is the only place tokens are defined
4. **No inline values** — `#2563eb`, `16px`, `8px` are forbidden in components
5. **Tailwind classes** — use Tailwind classes that map to tokens (`bg-primary`, `text-sm`, `rounded-lg`)
6. **Custom CSS** — use `var(--token-name)` in custom CSS
7. **Dark mode** — same token names, different values (via `.dark` class)
8. **New tokens** — require design system approval and update to this document

---

## Cross-References

- See `01-foundations.md` for detailed token explanations
- See `40-token-naming.md` for naming conventions
- See `38-responsive-rules.md` for responsive token usage
- See `39-rtl-rules.md` for RTL token usage
- See `product-architecture/17-product-rules.md` PR-45–PR-50 for design rules
