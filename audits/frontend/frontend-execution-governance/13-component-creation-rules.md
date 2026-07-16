# 13 — Component Creation Rules

> **Status:** FINAL — Process and criteria for creating new components

---

## 1. Purpose

Defines the mandatory process for creating any new component. This process ensures no duplicate components are created, all components follow the Design System V2, and all components are fully specified before implementation.

---

## 2. Pre-Creation Checklist (Mandatory)

Before creating ANY new component, complete this checklist:

### Step 1: Search Existing Components
- [ ] Searched `packages/ui/` for existing component
- [ ] Searched `src/features/*/components/` for existing domain component
- [ ] Searched `src/components/` for existing shared component
- [ ] Checked `06-component-traceability-map.md` for existing component
- [ ] Checked `design-system-v2/50-master-index.md` for component inventory

**If a component exists that does 80%+ of what's needed: DO NOT create a new component. Extend the existing one (see `14-component-modification-rules.md`).**

### Step 2: Verify Design System Specification
- [ ] Component spec exists in Design System V2 (`design-system-v2/[relevant].md`)
- [ ] Component is listed in `06-component-traceability-map.md`
- [ ] Component layer is identified (Primitive, Composite, Domain)
- [ ] Component name follows `design-system-v2/41-component-naming.md`

**If no spec exists: STOP. Create an ADR per `24-adr-process.md`. Do not create undocumented components.**

### Step 3: Verify Dependencies
- [ ] All dependencies (lower-layer components) are implemented
- [ ] All required tokens are defined in `design-system-v2/44-design-tokens.md`
- [ ] All required icons are identified in `design-system-v2/05-iconography.md`
- [ ] All required animations are identified in `design-system-v2/07-motion-system.md`

**If any dependency is missing: STOP. Implement dependencies first.**

### Step 4: Verify Readiness
- [ ] `09-definition-of-ready.md` per-component criteria met
- [ ] All specification fields are documented (see §3 below)

---

## 3. Required Component Specification Fields

Every new component MUST have ALL of the following documented in its DS V2 specification:

| Field | Required | Description |
|-------|----------|-------------|
| Purpose | ✅ | What the component does |
| Usage | ✅ | Where it's used |
| When to Use | ✅ | Appropriate use cases |
| When NOT to Use | ✅ | Inappropriate use cases |
| Hierarchy | ✅ | Position in component tree |
| Variants | ✅ | Visual variants (default, outline, ghost, etc.) |
| Sizes | ✅ | Size options (sm, default, lg) |
| States | ✅ | All interaction states (default, hover, focus, disabled, loading, error) |
| Props | ✅ | TypeScript prop interface |
| Icons | ✅ | Icons used (from Lucide) |
| Spacing | ✅ | Padding, margin, gap (using tokens) |
| Responsive behavior | ✅ | Behavior at each breakpoint |
| Accessibility | ✅ | ARIA, keyboard, screen reader |
| Keyboard behavior | ✅ | Key mappings (Tab, Enter, Escape, arrows) |
| Animations | ✅ | Motion inventory items used |
| Loading | ✅ | Loading state (if applicable) |
| Empty | ✅ | Empty state (if applicable) |
| Error | ✅ | Error state (if applicable) |
| Disabled | ✅ | Disabled state |
| Examples | ✅ | Usage examples |
| Anti-patterns | ✅ | What NOT to do with this component |
| Acceptance Criteria | ✅ | Criteria for completion |
| Future scalability | ✅ | Future enhancement possibilities |

**If ANY field is missing: STOP. Document the missing field before implementing.**

---

## 4. Component Creation Process

### 4.1 Step-by-Step

1. **Complete pre-creation checklist** (§2 above)
2. **Read the component spec** in Design System V2
3. **Read all dependency specs** (lower-layer components used)
4. **Read `design-system-v2/42-variant-rules.md`** for variant rules
5. **Read `design-system-v2/43-composition-rules.md`** for composition rules
6. **Create the component file** in the correct folder (per `27-folder-ownership.md`)
7. **Implement the component** following all spec details
8. **Write unit tests** for all variants, sizes, and states
9. **Test accessibility** (keyboard, screen reader, ARIA)
10. **Test responsive** (320px, 768px, 1024px, 1280px)
11. **Test RTL** (mirror layout, icons, text)
12. **Run self-audit** per `22-self-audit-process.md`
13. **Submit PR** per `23-pr-review-process.md`

### 4.2 Component File Template

```typescript
// packages/ui/button/button.tsx
'use client';

import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
}

// Component
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', loading, icon: Icon, iconPosition = 'left', className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && Icon && iconPosition === 'left' && <Icon className="h-4 w-4" />}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon className="h-4 w-4" />}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
```

### 4.3 Barrel Export

```typescript
// packages/ui/button/index.ts
export { Button, type ButtonProps } from './button';
```

### 4.4 Test File

```typescript
// packages/ui/button/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('shows loading spinner', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // ... test all variants, sizes, states
});
```

---

## 5. Component Creation Rules

### §5.1 Reuse First
Always search for existing components before creating new ones. If a component does 80%+ of what's needed, extend it rather than creating a new one.

### §5.2 No Undocumented Components
No component may be created without a complete DS V2 specification. If a spec is missing, create an ADR.

### §5.3 Layer Compliance
Components must be in the correct layer:
- **Primitive:** No dependencies on higher layers
- **Composite:** May depend on primitives only
- **Domain:** May depend on primitives and composites
- **Page:** May depend on all layers

### §5.4 Naming Compliance
Component names must follow `design-system-v2/41-component-naming.md`:
- PascalCase: `ScreenCard`, not `screenCard`
- Entity prefix for domain: `ScreenCard`, not `Card`
- Sub-component prefix: `CardHeader`, not `Header`
- File name: kebab-case: `screen-card.tsx`

### §5.5 Token Compliance
All components must use design tokens:
- No hardcoded colors, spacing, typography, radii, shadows
- Use Tailwind classes that map to tokens
- Use semantic tokens (`bg-primary`), not primitive (`bg-blue-600`)

### §5.6 Accessibility Compliance
All components must meet WCAG 2.1 AA:
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Focus management
- Screen reader support

### §5.7 State Compliance
All components must implement required states:
- Default, hover, focus, active, disabled
- Loading (if data-dependent)
- Error (if data-dependent)
- Empty (if data-dependent)

### §5.8 No Business Logic
Components must be presentational only:
- No API calls in components (use hooks)
- No business rules in components (use hooks/services)
- No data transformations in components (use utilities)

---

## 6. Component Approval Process

1. **Developer** creates component following this process
2. **Developer** runs self-audit (`22-self-audit-process.md`)
3. **Developer** submits PR with:
   - Component implementation
   - Unit tests
   - Updated traceability map (if needed)
   - Completed Definition of Done checklist
4. **Reviewer** verifies against component spec
5. **Reviewer** runs `23-pr-review-process.md`
6. **Merge** only after all checks pass

---

## Cross-References

- See `01-ai-constitution.md` Article VI for reusability rules
- See `06-component-traceability-map.md` for existing components
- See `09-definition-of-ready.md` for readiness criteria
- See `10-definition-of-done.md` for completion criteria
- See `14-component-modification-rules.md` for modification process
- See `15-design-system-enforcement.md` for DS enforcement
- See `design-system-v2/11-component-taxonomy.md` for taxonomy
- See `design-system-v2/41-component-naming.md` for naming
- See `design-system-v2/42-variant-rules.md` for variants
- See `design-system-v2/43-composition-rules.md` for composition
- See `27-folder-ownership.md` for folder placement
- See `28-file-ownership.md` for file naming
