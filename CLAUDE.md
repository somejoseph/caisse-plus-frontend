# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Caisse+** is a mobile-first POS (point-of-sale) and management app for West African bars/maquis (e.g., "Maquis Le Repère", Abidjan). It handles sales, cash register, stock, servers, suppliers, and PDF reporting. Currency is FCFA. The entire app is a **pure frontend SPA with no backend** — all data lives in React state seeded from `src/lib/mock-data.ts`.

## Commands

```bash
npm run dev      # start dev server (Vite, http://localhost:5173)
npm run build    # production build
npm run preview  # preview production build
npm run lint     # ESLint check
npm run format   # Prettier format (write)
```

No test suite exists yet.

## Architecture

### Stack
- **TanStack Router** v1 (file-based SPA routing) + **TanStack Query**
- **React 19**, **TypeScript**, **Tailwind CSS v4**, **shadcn/ui** (New York style, `components.json`)
- **Vite 8** as the build tool; entry point is `index.html` → `src/main.tsx`
- **jsPDF** for PDF report export (`src/lib/export-pdf.ts`)
- **Sonner** for toast notifications
- **npm** as package manager

### Routing
All routes live in `src/routes/`. Each `.tsx` file is one route — no `src/pages/` directory. `routeTree.gen.ts` is **auto-generated** by the `TanStackRouterVite` plugin on dev start; do not edit it by hand.

| Route | Purpose |
|---|---|
| `/` | Dashboard — daily revenue, alerts, quick actions |
| `/connexion`, `/inscription` | Auth screens (no real auth; `login()` flips a boolean in store) |
| `/ventes` | POS — browse drinks, build cart, checkout with table/server/payment method |
| `/caisse` | Cash register — balance, expense entry, payment breakdown |
| `/journal` | Sales log and reports |
| `/stock` | Stock overview with restock flow |
| `/catalogue` | Full drinks catalogue |
| `/approvisionnement` | Restocking orders |
| `/fournisseurs` | Suppliers CRUD |
| `/serveurs` | Staff + table management |
| `/inventaire` | Physical inventory count |
| `/audit` | Fraud / audit log |
| `/qr-menu` | QR-code menu generator |
| `/notifications` | Notification center |

Root layout is `src/routes/__root.tsx` — wraps everything in `QueryClientProvider` + `AppStoreProvider` + `<Toaster>`. The router is instantiated in `src/router.tsx` and mounted in `src/main.tsx`.

### Global state (`src/lib/store.tsx`)
A single React Context (`AppStoreProvider` / `useStore()`) holds **all mutable app state**:
- `drinks`, `expenses`, `sales`, `servers`, `tables`, `suppliers`, `notifications`
- Every write action (`addDrink`, `recordSale`, `restockDrink`, `addExpense`, etc.) also calls `pushNotification()` automatically.
- `loggedIn` flag controls auth; `login()` / `logout()` toggle it.
- State is seeded from `src/lib/mock-data.ts` on mount and is reset on page refresh (no persistence).

To add a new entity or mutation, add it to `StoreValue`, implement the setter inside the `useMemo` in `AppStoreProvider`, and consume via `useStore()`.

### Shared layout component
Every authenticated page renders inside `<AppLayout>` (`src/components/AppLayout.tsx`), which provides:
- Sticky header with hamburger, establishment info popover, notification bell
- Bottom navigation bar (Accueil, Caisse, Vendre FAB, Journal, Menu)
- Side drawer with full nav links and logout

### Design system
Defined in `src/styles.css` with Tailwind CSS v4 CSS variables (oklch). Key semantic tokens:
- `bg-brand-gradient` — teal gradient, used on hero cards and primary CTAs
- `shadow-card`, `shadow-elevated`, `shadow-float` — three elevation levels
- `--font-display: "Sora"` for headings/amounts; `--font-sans: "Plus Jakarta Sans"` for body
- `text-success / text-destructive / text-accent` — semantic status colors

### Reusable primitives
- `src/components/BottomSheet.tsx` — modal sheet from bottom; exports `BottomSheet`, `Field`, `inputClass`
- `src/components/AddDrinkSheet.tsx` — composed bottom sheet for adding a drink to the catalogue
- `src/components/ui/` — full shadcn/ui component set (do not edit these manually; use the shadcn CLI)
- `fcfa(value)` in `src/lib/mock-data.ts` — formats a number as FCFA string
- `SectionTitle` and `MethodBadge` exported from `src/routes/index.tsx` and imported by other routes

### PDF export (`src/lib/export-pdf.ts`)
`downloadReportPDF(meta, sections)` and `shareReportPDF(meta, sections)` build a branded A4 PDF using jsPDF. Accept `ReportMeta` (title, establishment, period) and an array of `ReportSection` (heading + typed columns + rows). Used in `/journal` and `/inventaire`.

### Path aliases
`@/` maps to `src/` (configured via `paths` in `tsconfig.json`, picked up by `vite-tsconfig-paths`). Always use `@/` imports, not relative paths.
