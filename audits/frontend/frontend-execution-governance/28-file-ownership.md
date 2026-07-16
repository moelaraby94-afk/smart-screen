# 28 — File Ownership

> **Status:** FINAL — File naming, placement, and ownership rules

---

## 1. Purpose

Defines file-level rules for naming, placement, and ownership. Every file must follow these rules. Enforced by AI Constitution (Article VI, §6.2).

---

## 2. File Naming Conventions

### 2.1 Component Files

| Type | Naming | Example |
|------|--------|---------|
| Component | `kebab-case.tsx` | `screen-card.tsx` |
| Component test | `kebab-case.test.tsx` | `screen-card.test.tsx` |
| Component index | `index.ts` | `index.ts` |
| Component styles | `kebab-case.module.css` (if needed) | `studio-canvas.module.css` |

### 2.2 Hook Files

| Type | Naming | Example |
|------|--------|---------|
| Hook | `use-[name].ts` | `use-screens.ts` |
| Hook test | `use-[name].test.ts` | `use-screens.test.ts` |

### 2.3 Utility Files

| Type | Naming | Example |
|------|--------|---------|
| Utility | `kebab-case.ts` | `api-client.ts` |
| Utility test | `kebab-case.test.ts` | `api-client.test.ts` |
| Constants | `kebab-case.ts` | `api-endpoints.ts` |

### 2.4 Type Files

| Type | Naming | Example |
|------|--------|---------|
| Types | `kebab-case.ts` | `screen-types.ts` or just `types.ts` in feature folder |

### 2.5 Page Files

| Type | Naming | Location |
|------|--------|----------|
| Page | `page.tsx` | `app/[route]/page.tsx` |
| Layout | `layout.tsx` | `app/[route]/layout.tsx` |
| Loading | `loading.tsx` | `app/[route]/loading.tsx` |
| Error | `error.tsx` | `app/[route]/error.tsx` |
| Not Found | `not-found.tsx` | `app/[route]/not-found.tsx` |

### 2.6 Translation Files

| Type | Naming | Location |
|------|--------|----------|
| English | `en.json` | `src/i18n/en.json` |
| Arabic | `ar.json` | `src/i18n/ar.json` |

---

## 3. File Placement Rules

### 3.1 Component Placement

| Component Layer | Location | Example |
|----------------|----------|---------|
| Primitive | `packages/ui/[name]/` | `packages/ui/button/button.tsx` |
| Composite | `packages/ui/[name]/` | `packages/ui/card/card.tsx` |
| Domain | `src/features/[feature]/components/` | `src/features/screens/components/screen-card.tsx` |
| Page | `src/app/[route]/page.tsx` | `src/app/(dashboard)/screens/page.tsx` |

### 3.2 Hook Placement

| Hook Type | Location | Example |
|-----------|----------|---------|
| Feature-specific | `src/features/[feature]/hooks/` | `src/features/screens/hooks/use-screens.ts` |
| Shared | `src/hooks/` | `src/hooks/use-debounce.ts` |

### 3.3 Utility Placement

| Utility Type | Location | Example |
|-------------|----------|---------|
| API client | `src/lib/` | `src/lib/api-client.ts` |
| Socket client | `src/lib/` | `src/lib/socket-client.ts` |
| General utils | `src/lib/` | `src/lib/utils.ts` |
| Validators | `src/lib/` | `src/lib/validators.ts` |
| Constants | `src/lib/` | `src/lib/api-endpoints.ts` |

### 3.4 Type Placement

| Type Scope | Location | Example |
|-----------|----------|---------|
| Global | `src/types/` | `src/types/entities.ts` |
| Feature | `src/features/[feature]/types.ts` | `src/features/screens/types.ts` |

---

## 4. File Content Rules

### 4.1 One Component Per File
- Each `.tsx` file contains ONE component (plus its sub-components if small)
- Exception: Sub-components that are < 50 lines and not reused may be in the same file

### 4.2 One Hook Per File
- Each `use-*.ts` file contains ONE hook
- Related types may be in the same file

### 4.3 File Size Limits

| File Type | Max Lines |
|-----------|-----------|
| Component file | 300 |
| Hook file | 200 |
| Utility file | 100 |
| Page file | 500 |
| Test file | No limit |

### 4.4 Import Rules

| Rule | Description |
|------|-------------|
| No relative imports across features | Use absolute imports (`@/features/...`) |
| No `..` beyond feature root | Stay within feature or use absolute |
| Absolute import alias | `@/` maps to `src/`, `@packages/ui` maps to `packages/ui/` |

### 4.5 Export Rules

| Rule | Description |
|------|-------------|
| Named exports | All components, hooks, utilities use named exports |
| No default exports | Except for Next.js `page.tsx`, `layout.tsx`, `error.tsx`, `loading.tsx` |
| Barrel exports | `index.ts` in each component/hook directory |
| No circular exports | A exports B, B exports A is forbidden |

---

## 5. File Ownership Matrix

| File Type | Who Creates | Who Modifies | Who Deletes |
|-----------|------------|-------------|-------------|
| `packages/ui/*` | Design System team | Design System team (ADR for breaking) | Design System team |
| `src/app/*` | Frontend team | Frontend team | Frontend team |
| `src/features/[feature]/*` | Feature team | Feature team | Feature team |
| `src/components/*` | Any team (shared) | Any team (with review) | Any team (with review) |
| `src/hooks/*` | Any team (shared) | Any team (with review) | Any team (with review) |
| `src/lib/*` | Any team (shared) | Any team (with review) | Any team (with review) |
| `src/types/*` | Any team (shared) | Any team (with review) | Any team (with review) |
| `src/styles/*` | Design System team | Design System team | Design System team |
| `src/i18n/*` | Any team | Any team (add keys) | Never delete keys |

---

## 6. File Creation Checklist

Before creating any file:
- [ ] File name follows naming convention (kebab-case)
- [ ] File is in the correct folder (per §3)
- [ ] File doesn't already exist (search first)
- [ ] File size will be within limits (per §4.3)
- [ ] File will use named exports (per §4.5)
- [ ] Test file will be created alongside (per §4.1)

---

## 7. Forbidden File Patterns

| Pattern | Why It's Forbidden |
|---------|-------------------|
| `Component.tsx` (PascalCase file) | Must be kebab-case: `component.tsx` |
| `component.jsx` (JSX extension) | Must be `.tsx` (TypeScript) |
| `utils.ts` with multiple unrelated utilities | One responsibility per file |
| `helpers.ts` (vague name) | Be specific: `date-formatters.ts` |
| `temp.ts` or `test2.ts` | No temporary files in codebase |
| `index.tsx` (in feature folders) | Only `index.ts` for barrel exports |
| Files in root `src/` | Must be in a subfolder |
| `.css` files (except globals.css) | Use Tailwind, not custom CSS |
| `.scss` or `.sass` files | Use Tailwind, not Sass |
| Files with no exports | Every file must export something (except pages) |

---

## Cross-References

- See `01-ai-constitution.md` Article VI §6.2 for file ownership
- See `27-folder-ownership.md` for folder-level rules
- See `29-naming-enforcement.md` for naming conventions
- See `12-frontend-architecture-rules.md` §5 for architecture
- See `design-system-v2/41-component-naming.md` for component naming
