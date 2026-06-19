import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wallet,
  ShoppingBag,
  PlusCircle,
  PackageSearch,
  Receipt,
  QrCode,
  Power,
  ArrowUpRight,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { fcfa, WEEK_SALES } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accueil — Caisse+" },
      { name: "description", content: "Tableau de bord du jour : chiffre d'affaires, caisse, alertes stock et actions rapides." },
    ],
  }),
  component: Home,
});

const quickActions = [
  { label: "Nouvelle vente", icon: PlusCircle, to: "/ventes", tone: "primary" },
  { label: "Voir le stock", icon: PackageSearch, to: "/stock", tone: "soft" },
  { label: "Dépense caisse", icon: Receipt, to: "/caisse", tone: "soft" },
  { label: "QR menu", icon: QrCode, to: "/qr-menu", tone: "soft" },
];

function Home() {
  const { drinks, sales } = useStore();
  const outOfStock = drinks.filter((d) => d.stock === 0).length;
  const lowStock = drinks.filter((d) => d.stock > 0 && d.stock <= d.threshold).length;
  const maxBar = Math.max(...WEEK_SALES.map((w) => w.value));

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Day status */}
        <div className="flex items-center justify-between rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Journée en cours</p>
              <p className="text-xs text-muted-foreground">Ouverte à 17:02 · Yao</p>
            </div>
          </div>
          <button className="flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive">
            <Power className="h-3.5 w-3.5" /> Clôturer
          </button>
        </div>

        {/* Hero CA card */}
        <div className="overflow-hidden rounded-3xl bg-brand-gradient p-5 text-primary-foreground shadow-elevated">
          <p className="text-sm font-medium text-primary-foreground/80">Chiffre d'affaires du jour</p>
          <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{fcfa(322100)}</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
            <TrendingUp className="h-3.5 w-3.5" /> +18 % vs hier
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
            <MiniStat label="Ventes" value="42" />
            <MiniStat label="Bénéfice" value={fcfa(118400)} />
            <MiniStat label="Crédit" value={fcfa(41600)} />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Wallet}
            label="Solde caisse"
            value={fcfa(184500)}
            hint="Espèces comptées"
            tone="primary"
          />
          <StatCard
            icon={ShoppingBag}
            label="Panier moyen"
            value={fcfa(7669)}
            hint="+4 % cette semaine"
            tone="amber"
          />
        </div>

        {/* Alerts */}
        {(outOfStock > 0 || lowStock > 0) && (
          <Link
            to="/stock"
            className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {outOfStock} en rupture · {lowStock} sous le seuil
                </p>
                <p className="text-xs text-muted-foreground">Réapprovisionnement conseillé</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-accent" />
          </Link>
        )}

        {/* Quick actions */}
        <section>
          <SectionTitle title="Actions rapides" />
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className={
                  a.tone === "primary"
                    ? "flex items-center gap-3 rounded-2xl bg-brand-gradient px-4 py-4 text-primary-foreground shadow-card active:scale-[0.98]"
                    : "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-foreground shadow-card active:scale-[0.98]"
                }
              >
                <a.icon className={a.tone === "primary" ? "h-6 w-6" : "h-6 w-6 text-primary"} />
                <span className="text-sm font-semibold leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Week chart */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle title="Évolution 7 jours" noMargin />
            <span className="text-xs font-semibold text-success">+12 %</span>
          </div>
          <div className="flex h-32 items-end justify-between gap-2">
            {WEEK_SALES.map((w, i) => (
              <div key={w.day} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-t-lg ${i === WEEK_SALES.length - 1 ? "bg-secondary" : "bg-primary/80"}`}
                  style={{ height: `${(w.value / maxBar) * 100}%` }}
                />
                <span className="text-[10px] font-medium text-muted-foreground">{w.day}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent sales */}
        <section>
          <div className="flex items-center justify-between">
            <SectionTitle title="Dernières ventes" noMargin />
            <Link to="/journal" className="text-xs font-semibold text-primary">
              Tout voir
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {sales.slice(0, 4).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                    {s.time.slice(0, 5)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {s.id} · {s.table}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.items} articles · {s.server}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-foreground">{fcfa(s.total)}</p>
                  <MethodBadge method={s.method} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-primary-foreground/70">{label}</p>
      <p className="font-display text-base font-bold tabular-nums">{value}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint: string;
  tone: "primary" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
          tone === "primary" ? "bg-primary/10 text-primary" : "bg-secondary/15 text-secondary"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

export function SectionTitle({ title, noMargin }: { title: string; noMargin?: boolean }) {
  return <h2 className={`text-base font-bold text-foreground ${noMargin ? "" : "mb-3"}`}>{title}</h2>;
}

export function MethodBadge({ method }: { method: string }) {
  const map: Record<string, string> = {
    Espèces: "bg-primary/10 text-primary",
    "Mobile Money": "bg-secondary/15 text-secondary",
    Crédit: "bg-accent/10 text-accent",
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${map[method] ?? "bg-muted text-muted-foreground"}`}>
      {method}
    </span>
  );
}
