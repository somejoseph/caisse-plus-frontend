import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Wallet,
  ScrollText,
  Plus,
  Menu,
  Bell,
  X,
  Boxes,
  Users,
  Truck,
  ClipboardCheck,
  BookOpen,
  QrCode,
  ShieldCheck,
  Building2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ESTABLISHMENT, CURRENT_USER } from "@/lib/mock-data";

const navItems = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/caisse", label: "Caisse", icon: Wallet },
  { to: "/journal", label: "Journal", icon: ScrollText },
];

const drawerLinks = [
  { to: "/stock", label: "Stock & Catalogue", icon: Boxes },
  { to: "/serveurs", label: "Serveurs & Tables", icon: Users },
  { to: "/journal", label: "Journal & Rapports", icon: ScrollText },
  { to: "#", label: "Approvisionnement", icon: Truck },
  { to: "#", label: "Inventaire", icon: ClipboardCheck },
  { to: "#", label: "Catalogue boissons", icon: BookOpen },
  { to: "#", label: "QR Code menu", icon: QrCode },
  { to: "#", label: "Anti-fraude & audit", icon: ShieldCheck },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background shadow-card sm:my-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-brand-gradient px-4 pb-4 pt-5 text-primary-foreground">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Ouvrir le menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 active:scale-95"
            >
              <Menu className="h-5 w-5" />
            </button>

            <button className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold">
              <Building2 className="h-4 w-4" />
              <span className="max-w-[140px] truncate">{ESTABLISHMENT.name}</span>
              <ChevronDown className="h-4 w-4 opacity-80" />
            </button>

            <button
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 active:scale-95"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-secondary ring-2 ring-primary-dark" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur">
          <div className="grid grid-cols-5 items-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
            {navItems.slice(0, 2).map((item) => (
              <NavTab key={item.label} {...item} active={pathname === item.to} />
            ))}

            <div className="flex justify-center">
              <Link
                to="/ventes"
                className="-mt-8 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-brand-gradient text-primary-foreground shadow-elevated ring-4 ring-background active:scale-95"
              >
                <Plus className="h-6 w-6" />
                <span className="text-[10px] font-bold">Vendre</span>
              </Link>
            </div>

            <NavTab {...navItems[2]} active={pathname === "/journal"} />
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center gap-1 py-1 text-muted-foreground"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-semibold">Menu</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button
            aria-label="Fermer"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
          />
          <aside className="relative ml-0 flex h-full w-[82%] max-w-xs flex-col bg-sidebar text-sidebar-foreground shadow-float">
            <div className="bg-brand-gradient px-5 pb-6 pt-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <span className="font-display text-xl font-extrabold">Caisse+</span>
                <button onClick={() => setDrawerOpen(false)} aria-label="Fermer le menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 font-bold">
                  {CURRENT_USER.initials}
                </div>
                <div>
                  <p className="font-semibold leading-tight">{CURRENT_USER.name}</p>
                  <p className="text-xs text-primary-foreground/80">
                    {CURRENT_USER.role} · Code {ESTABLISHMENT.code}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
              {drawerLinks.map((link) =>
                link.to === "#" ? (
                  <div
                    key={link.label}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground"
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                      pathname === link.to
                        ? "bg-sidebar-accent text-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                ),
              )}
            </div>
            <p className="px-5 py-4 text-xs text-muted-foreground">Caisse+ v2.1 · Sohapigroup</p>
          </aside>
        </div>
      )}
    </div>
  );
}

function NavTab({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-1 transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
      <span className="text-[10px] font-semibold">{label}</span>
    </Link>
  );
}
