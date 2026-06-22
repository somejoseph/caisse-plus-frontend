import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home, Wallet, ScrollText, Plus, Menu, Bell, X, Boxes, Users, Truck,
  ClipboardCheck, BookOpen, QrCode, ShieldCheck, Building2, ChevronDown,
  LogOut, MapPin, Hash, Check, Crown, Briefcase, BarChart2, Landmark,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { getUnreadCountApi } from "@/lib/graphql/operations";
import { setUnauthorizedHandler } from "@/lib/gql-client";
import logo from "@/assets/logo.png";

const navItems = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/caisse", label: "Caisse", icon: Wallet },
  { to: "/journal", label: "Journal", icon: ScrollText },
];

const drawerLinks = [
  { to: "/stock", label: "Stock & Catalogue", icon: Boxes },
  { to: "/serveurs", label: "Serveurs & Tables", icon: Users },
  { to: "/journal", label: "Journal & Rapports", icon: ScrollText },
  { to: "/approvisionnement", label: "Gestion de Stock", icon: Truck },
  { to: "/fournisseurs", label: "Fournisseurs", icon: Building2 },
  { to: "/inventaire", label: "Inventaire", icon: ClipboardCheck },
  { to: "/catalogue", label: "Catalogue boissons", icon: BookOpen },
  { to: "/rapports", label: "Rapports & Bilan", icon: BarChart2 },
  { to: "/tresorerie", label: "Trésorerie", icon: Landmark, ownerOnly: true },
  { to: "/audit", label: "Anti-fraude & audit", icon: ShieldCheck, ownerOnly: true },
  { to: "/qr-menu", label: "QR Code menu", icon: QrCode },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [estOpen, setEstOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { establishment, logout, currentRole, currentUserName, loggedIn } = useStore();

  useEffect(() => {
    if (!loggedIn) navigate({ to: "/connexion" });
  }, [loggedIn, navigate]);

  // Auto-logout si le serveur répond 401 (token expiré)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate({ to: "/connexion" });
    });
  }, [logout, navigate]);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadCount"],
    queryFn: getUnreadCountApi,
    refetchInterval: 30_000,
    enabled: loggedIn,
  });

  const RoleIcon = currentRole === "Propriétaire" ? Crown : Briefcase;
  const userInitials = currentUserName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const visibleDrawerLinks = currentRole === "Propriétaire"
    ? drawerLinks
    : drawerLinks.filter((l) => !(l as { ownerOnly?: boolean }).ownerOnly);

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    toast.success("Déconnexion réussie");
    // La navigation vers /connexion est gérée par le useEffect (loggedIn → false)
  };

  if (!loggedIn) return <div className="min-h-screen bg-background" />;

  const estab = establishment ?? { name: "Caisse+", code: "—", type: "Maquis", city: null, logoUrl: null };
  const logoSrc = estab.logoUrl ?? logo;

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

            <div className="relative">
              <button
                onClick={() => setEstOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-white/15 py-1 pl-1 pr-3 text-sm font-semibold active:scale-95"
              >
                <img src={logoSrc} alt="Logo" width={28} height={28} className="h-7 w-7 rounded-full bg-white/90 p-0.5 object-cover" />
                <span className="max-w-[120px] truncate">{estab.name}</span>
                <ChevronDown className={cn("h-4 w-4 opacity-80 transition-transform", estOpen && "rotate-180")} />
              </button>

              {estOpen && (
                <>
                  <button aria-label="Fermer" onClick={() => setEstOpen(false)} className="fixed inset-0 z-40 cursor-default" />
                  <div className="absolute left-1/2 top-12 z-50 w-64 -translate-x-1/2 rounded-2xl border border-border bg-card p-4 text-foreground shadow-float">
                    <div className="flex items-center gap-3">
                      <img src={logoSrc} alt="Logo Caisse+" width={44} height={44} className="h-11 w-11 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-bold leading-tight">{estab.name}</p>
                        <p className="text-xs text-muted-foreground">{estab.type}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Hash className="h-4 w-4 text-primary" /> Code&nbsp;
                        <span className="font-bold text-foreground">{estab.code}</span>
                      </p>
                      {estab.city && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 text-primary" /> {estab.city}
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" /> {currentUserName} · {currentRole}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2 text-xs font-semibold text-success">
                      <Check className="h-4 w-4" /> Établissement actif
                    </div>
                  </div>
                </>
              )}
            </div>

            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 active:scale-95"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold text-foreground ring-2 ring-primary-dark">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border bg-card/95 backdrop-blur">
          {currentRole === "Propriétaire" ? (
            <div className="grid grid-cols-5 items-end px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
              <NavTab to="/" label="Accueil" icon={Home} active={pathname === "/"} />
              <NavTab to="/caisse" label="Caisse" icon={Wallet} active={pathname === "/caisse"} />
              <NavTab to="/rapports" label="Rapports" icon={BarChart2} active={pathname === "/rapports"} />
              <NavTab to="/tresorerie" label="Trésorerie" icon={Landmark} active={pathname === "/tresorerie"} />
              <NavTab to="/audit" label="Audit" icon={ShieldCheck} active={pathname === "/audit"} />
            </div>
          ) : (
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
              <button onClick={() => setDrawerOpen(true)} className="flex flex-col items-center gap-1 py-1 text-muted-foreground">
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-semibold">Menu</span>
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <button aria-label="Fermer" onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          <aside className="relative ml-0 flex h-full w-[82%] max-w-xs flex-col bg-sidebar text-sidebar-foreground shadow-float">
            <div className="bg-brand-gradient px-5 pb-6 pt-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-display text-xl font-extrabold">
                  <img src={logo} alt="Logo Caisse+" width={32} height={32} className="h-8 w-8 rounded-lg bg-white/90 p-0.5" />
                  Caisse+
                </span>
                <button onClick={() => setDrawerOpen(false)} aria-label="Fermer le menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 font-bold">
                  {userInitials}
                </div>
                <div>
                  <p className="font-semibold leading-tight">{currentUserName}</p>
                  <p className="flex items-center gap-1 text-xs text-primary-foreground/80">
                    <RoleIcon className="h-3 w-3" /> {currentRole} · Code {estab.code}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
              {visibleDrawerLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                    pathname === link.to ? "bg-sidebar-accent text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-sidebar-border px-3 py-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                Déconnexion
              </button>
              <p className="px-2 pt-2 text-xs text-muted-foreground">Caisse+ v2.1 · JS-DEV · tout droits reservés</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function NavTab({ to, label, icon: Icon, active }: { to: string; label: string; icon: typeof Home; active: boolean }) {
  return (
    <Link to={to} className={cn("flex flex-col items-center gap-1 py-1 transition-colors", active ? "text-primary" : "text-muted-foreground")}>
      <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
      <span className="text-[10px] font-semibold">{label}</span>
    </Link>
  );
}
