# 05 — Iconography

> **Evidence basis:** `01-foundations.md`, `ux-blueprint/03-component-ux-standards.md` §6, `screen-specifications/01-global-layout-spec.md`, `product-architecture/17-product-rules.md` PR-46

---

## 1. Icon Library

**Library:** Lucide React (`lucide-react`)

Lucide is an open-source icon library that provides consistent, modern, line-based icons. It is already installed in the project (root `node_modules`).

### 1.1 Why Lucide

- **Consistent style:** All icons share the same line weight, corner radius, and visual language
- **Tree-shakeable:** Only imported icons are bundled
- **React-native:** `<Icon />` components with `size`, `color`, `strokeWidth` props
- **RTL-aware:** Icons can be mirrored for RTL layouts
- **Accessible:** Icons accept `aria-label` and `aria-hidden` props

---

## 2. Icon Sizes

| Token | Size | Usage |
|-------|------|-------|
| `--icon-xs` | 14px | Inline icons in badges, table cells, small labels |
| `--icon-sm` | 16px | Button icons, input adornments, toolbar icons |
| `--icon-md` | 18px | Sidebar items, card actions, list item icons |
| `--icon-lg` | 20px | Section headers, prominent actions |
| `--icon-xl` | 24px | Empty state icons, large feature icons |
| `--icon-2xl` | 32px | Onboarding step icons, hero icons |
| `--icon-3xl` | 48px | Error page icons, auth brand icons |

---

## 3. Icon Stroke Width

| Context | Stroke Width | Rationale |
|---------|-------------|-----------|
| Default | 2 | Lucide default; balanced visibility |
| Dense UI (tables, badges) | 1.5 | Reduces visual weight in compact spaces |
| Large icons (empty states, onboarding) | 1.5 | Softer appearance at large sizes |

---

## 4. Icon Color

Icons inherit color from parent text by default. Use semantic tokens:

| Context | Color Token |
|---------|-------------|
| Button icon | `currentColor` (inherits button text color) |
| Sidebar active item | `--primary` |
| Sidebar inactive item | `--muted-foreground` |
| Input adornment | `--muted-foreground` |
| Status icon (online) | `--success` |
| Status icon (offline) | `--destructive` |
| Status icon (warning) | `--warning` |
| Empty state icon | `--muted-foreground` |
| Error page icon | `--destructive` or `--warning` |
| Card action icon | `--muted-foreground` (hover: `--foreground`) |

---

## 5. Icon Usage Catalog

### 5.1 Navigation Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Layout Dashboard | `LayoutDashboard` | Overview sidebar |
| Monitor | `Monitor` | Screens sidebar |
| Image | `Image` | Content sidebar |
| Calendar Clock | `CalendarClock` | Scheduling sidebar |
| Bar Chart 3 | `BarChart3` | Analytics sidebar |
| Users | `Users` | Team sidebar |
| Settings | `Settings` | Settings sidebar |
| Building 2 | `Building2` | Admin Customers sidebar |
| User Cog | `UserCog` | Admin Staff sidebar |
| Hard Drive | `HardDrive` | Admin Fleet sidebar |
| Activity | `Activity` | Admin Health sidebar |
| Scroll Text | `ScrollText` | Admin Logs sidebar |
| Flag | `Flag` | Admin Feature Flags sidebar |

### 5.2 Action Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Plus | `Plus` | Add, Create |
| Upload | `Upload` | Upload media |
| Download | `Download` | Download, export |
| Trash 2 | `Trash2` | Delete |
| Edit / Pencil | `Pencil` | Edit, rename |
| Copy | `Copy` | Duplicate, copy to clipboard |
| X | `X` | Close, cancel, remove |
| Check | `Check` | Confirm, success |
| Chevron Down | `ChevronDown` | Dropdown, expand |
| Chevron Right | `ChevronRight` | Breadcrumb, navigate forward |
| Chevron Left | `ChevronLeft` | Back, navigate backward |
| Arrow Left | `ArrowLeft` | Back button |
| Arrow Right | `ArrowRight` | Forward, next step |
| More Horizontal | `MoreHorizontal` | Card "More" menu |
| Search | `Search` | Search input |
| Filter | `Filter` | Filter button |
| Sort Desc | `SortDesc` | Sort button |
| Refresh Cw | `RefreshCw` | Retry, refresh |
| Eye | `Eye` | Show password, visibility toggle |
| Eye Off | `EyeOff` | Hide password, hide layer |
| Send | `Send` | Publish, send invite |
| Play | `Play` | Preview, play |
| Pause | `Pause` | Pause |
| Lock | `Lock` | Lock layer, security |
| Unlock | `Unlock` | Unlock layer |
| Log Out | `LogOut` | Logout |
| Mail | `Mail` | Email, invitation |

### 5.3 Status Icons

| Icon | Lucide Name | Usage |
|------|-------------|-------|
| Circle (filled) | `Circle` | Status dot (online, offline) |
| Alert Triangle | `AlertTriangle` | Warning, error |
| Alert Circle | `AlertCircle` | Info, error |
| Check Circle | `CheckCircle` | Success, online |
| X Circle | `XCircle` | Failure, offline |
| Clock | `Clock` | Time, pending, schedule |
| Loader | `Loader2` | Loading spinner (with spin animation) |

---

## 6. Icon Rules

- **Never** use raw SVGs — always use Lucide React components
- **Never** mix icon libraries — Lucide only
- **Size:** Always use `size` prop, never CSS `width`/`height` on icons
- **Color:** Always inherit from parent (`currentColor`); use `className` for color overrides
- **Stroke width:** Default 2; use 1.5 for dense UI and large icons
- **Spacing:** `--space-0.5` (2px) between icon and text in buttons; `--space-2` (8px) in list items
- **Accessibility:** Decorative icons: `aria-hidden="true"`; meaningful icons: `aria-label`
- **RTL:** Directional icons (arrows, chevrons) must be mirrored in RTL — use `rtl:rotate-180` or conditional rendering
- **No emojis** as icons — always use Lucide components

---

## 7. RTL Icon Behavior

| Icon | LTR | RTL | Method |
|------|-----|-----|--------|
| Arrow Left | ← | → | `rtl:rotate-180` |
| Arrow Right | → | ← | `rtl:rotate-180` |
| Chevron Right | › | ‹ | `rtl:rotate-180` |
| Chevron Left | ‹ | › | `rtl:rotate-180` |
| More Horizontal | ⋯ | ⋯ | No change (symmetrical) |
| Refresh | ↻ | ↺ | `rtl:rotate-180` (optional) |

Non-directional icons (Plus, Trash, Check, X, Search, etc.) do not need RTL mirroring.

---

## Cross-References

- See `01-foundations.md` for color tokens used in icons
- See `09-interaction-states.md` for icon hover/active states
- See `10-accessibility-rules.md` for icon accessibility rules
- See `39-rtl-rules.md` for RTL icon mirroring rules
- See `ux-blueprint/03-component-ux-standards.md` §6 for icon standards
- See `screen-specifications/01-global-layout-spec.md` for sidebar icon usage
- See `product-architecture/17-product-rules.md` PR-46 for icon rules
