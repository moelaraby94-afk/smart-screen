# 43 — Composition Rules

> **Evidence basis:** `11-component-taxonomy.md`, `14-form-standards.md`, `03-layout-system.md`, `product-architecture/14-frontend-component-architecture.md`, `ux-blueprint/03-component-ux-standards.md`

---

## 1. Composition Philosophy

Composition rules define **how components combine** to form larger structures. Good composition ensures components are reusable, predictable, and maintainable. The design system enforces strict layering and composition rules.

---

## 2. Layer Rules

### 2.1 Dependency Direction

```
Layer 4 (Page) → Layer 3 (Domain) → Layer 2 (Composite) → Layer 1 (Primitive)
```

- Higher layers may import lower layers
- Lower layers may **never** import higher layers
- No circular dependencies at any layer

### 2.2 Layer Definitions

| Layer | Can Import | Cannot Import |
|-------|-----------|---------------|
| Primitive (1) | Nothing | Any higher layer |
| Composite (2) | Primitive | Domain, Page |
| Domain (3) | Primitive, Composite | Other Domain (avoid), Page |
| Page (4) | All layers | Nothing above |

---

## 3. Composition Patterns

### 3.1 Form Composition

```
Form
  └── FormField (Composite)
       ├── Label (Primitive)
       ├── Input (Primitive)
       ├── HelperText (Composite)
       └── FormError (Composite)
            └── Icon (Primitive)
```

**Rules:**
- `Form` wraps all fields
- `FormField` wraps each field (label + input + error)
- `FormActions` wraps buttons (Cancel + Submit)
- One `FormField` per field — never combine fields

### 3.2 Card Composition

```
Card (Composite)
  ├── CardHeader (Sub)
  │    ├── CardTitle (Sub)
  │    └── CardDescription (Sub)
  ├── CardContent (Sub)
  │    └── [Any content]
  └── CardFooter (Sub)
       └── Button(s) (Primitive)
```

**Rules:**
- Use `CardHeader`, `CardContent`, `CardFooter` for structured cards
- Content can be any component (List, Table, Chart, etc.)
- Footer contains actions (Buttons)
- No nested cards — use sections within a card instead

### 3.3 Table Composition

```
Table (Composite)
  ├── TableHeader (Sub)
  │    └── TableRow (Sub)
  │         └── TableHead (Sub) × N
  └── TableBody (Sub)
       └── TableRow (Sub) × N
            └── TableCell (Sub) × N
```

**Rules:**
- Always use `TableHeader` with `TableHead` for column labels
- `TableRow` in body contains `TableCell`s
- Cell content can be text, Badge, Button, or any primitive

### 3.4 Dialog Composition

```
Dialog (Composite)
  ├── DialogOverlay (Sub)
  └── DialogContent (Sub)
       ├── DialogHeader (Sub)
       │    ├── DialogTitle (Sub)
       │    └── DialogDescription (Sub)
       ├── DialogBody (Sub)
       │    └── Form / Content
       └── DialogFooter (Sub)
            └── Button(s) (Primitive)
```

**Rules:**
- Always include `DialogTitle` (required for `aria-labelledby`)
- Footer: Cancel (left) + Confirm (right)
- Body can contain Form, List, or any content
- No nested dialogs

### 3.5 List Composition

```
List (Composite)
  └── ListItem (Sub) × N
       ├── ListItemIcon / ListItemAvatar (Sub)
       ├── ListItemContent (Sub)
       │    ├── ListItemTitle (Sub)
       │    └── ListItemSubtitle (Sub)
       └── ListItemAction (Sub)
```

**Rules:**
- All items in a list should use the same structure
- `ListItemIcon` or `ListItemAvatar` (not both)
- `ListItemAction` is optional

### 3.6 Page Composition

```
Page (Layer 4)
  ├── PageHeader
  │    ├── Breadcrumbs (Composite)
  │    ├── H1 Title
  │    └── Actions (Buttons)
  ├── FilterToolbar (Composite)
  │    ├── SearchInput (Composite)
  │    ├── FilterSelect (Composite) × N
  │    └── SortSelect (Composite)
  └── Content Area
       ├── Card Grid (Cards) or Table or List
       └── Pagination (Composite)
```

**Rules:**
- Page header is always first
- Toolbar (if present) is below header
- Content fills remaining space
- Pagination (if present) is last

---

## 4. Composition Anti-Patterns

| Anti-Pattern | Why It's Bad | Correct Approach |
|--------------|-------------|-----------------|
| Nested cards | Visual confusion, unclear hierarchy | Use sections within a card |
| Nested dialogs | Focus trap conflicts, UX confusion | Redesign flow to avoid nesting |
| Card inside table cell | Layout issues, inconsistent | Use Badge or inline content |
| Table inside dialog | Scrolling conflicts, height issues | Use List instead, or limit rows |
| Button inside Button | Invalid HTML | Use div with onClick for container |
| Form inside Form | Invalid HTML | Use one form with sections |
| List inside List | Unclear hierarchy | Use groups or sections |
| Primitive importing domain | Breaks layer rules | Domain imports primitive, not vice versa |
| Domain importing domain | Tight coupling | Extract shared logic to composite |
| 10+ components in one page | Too complex | Break into sub-page components |

---

## 5. Slot Pattern

Some components use **slots** (children) for flexible composition:

| Component | Slot | Expected Content |
|-----------|------|-----------------|
| `Card` | `children` | Any content |
| `CardContent` | `children` | Any content |
| `DialogContent` | `children` | Form or content |
| `DialogFooter` | `children` | Buttons |
| `ListItemAction` | `children` | Button, Badge, text |
| `Widget` | `children` | Chart, List, custom |
| `EmptyStateAction` | `children` | Button |

### Slot Rules
- Slots should accept `ReactNode`
- Slots should have clear documentation on expected content
- Slots should not enforce specific components (flexibility)
- Slots should have sensible defaults (e.g., empty footer = no footer)

---

## 6. Prop Forwarding

Components should forward relevant props to their children:

| Component | Forwards | To |
|-----------|----------|----|
| `Button` | `onClick`, `disabled`, `type`, `aria-*` | `<button>` |
| `Input` | `value`, `onChange`, `onBlur`, `placeholder`, `aria-*` | `<input>` |
| `Card` (interactive) | `onClick`, `role`, `aria-*` | `<div>` |
| `Dialog` | `open`, `onOpenChange` | Overlay + Content |

### Rules
- Forward standard HTML attributes (`id`, `className`, `aria-*`, `data-*`)
- Do not forward internal props (`variant`, `size` — these are consumed)
- Use spread operator: `{...props}` for pass-through

---

## Cross-References

- See `11-component-taxonomy.md` for layer definitions
- See `14-form-standards.md` for form composition
- See `03-layout-system.md` for page composition
- See `41-component-naming.md` for naming
- See `42-variant-rules.md` for variant rules
- See `product-architecture/14-frontend-component-architecture.md` for architecture
