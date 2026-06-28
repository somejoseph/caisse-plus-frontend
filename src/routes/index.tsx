import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, AlertTriangle, PlusCircle, PackageSearch, Receipt, QrCode, Power, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { fcfa, type SaleEntry, type Expense } from "@/lib/mock-data";
import {
  getDrinksApi, getSalesApi, getExpensesApi, getCurrentDaySessionApi,
  openDaySessionApi, closeDaySessionApi,
} from "@/lib/graphql/operations";
import { SaleDetailSheet } from "@/components/SaleDetailSheet";
import { METHOD_LABEL } from "@/lib/graphql/adapters";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Home,
});

const quickActions = [
  { label: "Nouvelle vente", icon: PlusCircle, to: "/ventes", tone: "primary" },
  { label: "Voir le stock", icon: PackageSearch, to: "/stock", tone: "soft" },
  { label: "Dépense caisse", icon: Receipt, to: "/caisse", tone: "soft" },
  { label: "QR menu", icon: QrCode, to: "/qr-menu", tone: "soft" },
];

function Home() {
  const qc = useQueryClient();
  const [openSheetVisible, setOpenSheetVisible] = useState(false);
  const [closeSheetVisible, setCloseSheetVisible] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const { data: drinks = [] } = useQuery({ queryKey: ["drinks"], queryFn: () => getDrinksApi() });
  const { data: daySession } = useQuery({ queryKey: ["daySession"], queryFn: getCurrentDaySessionApi });
  const { data: sales = [] } = useQuery({
    queryKey: ["sales", today],
    queryFn: () => getSalesApi(500, today, today),
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", daySession?.id],
    queryFn: () => getExpensesApi(200, daySession?.id),
    enabled: daySession !== undefined,
  });

  const from14 = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
  const { data: chartSales = [] } = useQuery({
    queryKey: ["sales", "chart14", today],
    queryFn: () => getSalesApi(5000, from14, today),
  });

  const dayOpen = !!daySession;
  const outOfStock = drinks.filter((d) => d.stock === 0).length;
  const lowStock = drinks.filter((d) => d.stock > 0 && d.stock <= d.threshold).length;
  const activeSales = sales.filter((s) => s.status !== "Annulée");
  const totalCA = activeSales.reduce((s, v) => s + v.total, 0);

  const DAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000);
    const date = d.toISOString().slice(0, 10);
    return {
      date,
      label: DAY_SHORT[d.getDay()],
      total: chartSales
        .filter((s) => s.date === date && s.status !== "Annulée")
        .reduce((a, s) => a + s.total, 0),
    };
  });
  const prevWeekTotal = days14.slice(0, 7).reduce((a, d) => a + d.total, 0);
  const thisWeekTotal = days14.slice(7).reduce((a, d) => a + d.total, 0);
  const pctChange = prevWeekTotal > 0
    ? Math.round(((thisWeekTotal - prevWeekTotal) / prevWeekTotal) * 100)
    : null;
  const chartDays = days14.slice(7);
  const chartMax = Math.max(...chartDays.map((d) => d.total), 1);

  const { currentRole } = useStore();
  const isOwner = currentRole === "Propriétaire";
  const creditCA = activeSales
    .filter((s) => s.method === "Crédit")
    .reduce((a, s) => a + s.total, 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {dayOpen ? (
          <div className="flex items-center justify-between rounded-2xl border border-success/30 bg-success/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Journée en cours</p>
                <p className="text-xs text-muted-foreground">
                  Ouverte à {daySession?.openedAt}{daySession?.openedByName ? ` · ${daySession.openedByName}` : ""}
                </p>
              </div>
            </div>
            <button onClick={() => setCloseSheetVisible(true)} className="flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 text-xs font-bold text-destructive active:scale-95">
              <Power className="h-3.5 w-3.5" /> Clôturer
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Journée fermée</p>
                <p className="text-xs text-muted-foreground">Ouvrez la caisse pour commencer</p>
              </div>
            </div>
            <button onClick={() => setOpenSheetVisible(true)} className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground active:scale-95">
              <Power className="h-3.5 w-3.5" /> Ouvrir
            </button>
          </div>
        )}

        {!isOwner && (
          <div className="overflow-hidden rounded-2xl bg-brand-gradient px-4 py-3 text-primary-foreground shadow-elevated">
            <p className="text-xs font-medium text-primary-foreground/80">Chiffre d'affaires du jour</p>
            <p className="mt-0.5 font-display text-2xl font-extrabold tabular-nums">{fcfa(totalCA)}</p>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
              <TrendingUp className="h-2.5 w-2.5" /> Aujourd'hui
            </div>
            <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-white/15 pt-2.5">
              <MiniStat label="Ventes" value={String(activeSales.length)} />
              <MiniStat label="Panier moy." value={fcfa(activeSales.length ? totalCA / activeSales.length : 0)} />
              <MiniStat label="Crédit" value={fcfa(creditCA)} />
            </div>
          </div>
        )}

        {(outOfStock > 0 || lowStock > 0) && (
          <Link to="/stock" className="flex items-center justify-between rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{outOfStock} en rupture · {lowStock} sous le seuil</p>
                <p className="text-xs text-muted-foreground">Réapprovisionnement conseillé</p>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 text-accent" />
          </Link>
        )}

        <section>
          <SectionTitle title="Actions rapides" />
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((a) => (
              <Link key={a.label} to={a.to} className={a.tone === "primary"
                ? "flex items-center gap-3 rounded-2xl bg-brand-gradient px-4 py-4 text-primary-foreground shadow-card active:scale-[0.98]"
                : "flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-foreground shadow-card active:scale-[0.98]"}>
                <a.icon className={a.tone === "primary" ? "h-6 w-6" : "h-6 w-6 text-primary"} />
                <span className="text-sm font-semibold leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle title="Évolution 7 jours" noMargin />
            {pctChange !== null && (
              <span className={`text-xs font-semibold ${pctChange >= 0 ? "text-success" : "text-destructive"}`}>
                {pctChange >= 0 ? "+" : ""}{pctChange} %
              </span>
            )}
          </div>
          <div className="flex h-32 items-end justify-between gap-2">
            {chartDays.map((d, i) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`w-full rounded-t-lg ${i === chartDays.length - 1 ? "bg-secondary" : "bg-primary/80"}`}
                  style={{ height: `${(d.total / chartMax) * 100}%`, minHeight: d.total > 0 ? "3px" : "1px" }}
                />
                <span className="text-[10px] font-medium text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <SectionTitle title="Dernières ventes" noMargin />
            <Link to="/journal" className="text-xs font-semibold text-primary">Tout voir</Link>
          </div>
          <div className="mt-3 space-y-2">
            {sales.slice(0, 4).map((s) => {
              const cancelled = s.status === "Annulée";
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSaleId(s.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 shadow-card active:scale-[0.99] text-left ${cancelled ? "border-destructive/20 bg-card opacity-50" : "border-border bg-card"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{s.time.slice(0, 5)}</div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{s.ticketNumber} · {s.table}</p>
                      <p className="text-xs text-muted-foreground">{s.items} articles · {s.server}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold tabular-nums ${cancelled ? "text-destructive line-through" : "text-foreground"}`}>{fcfa(s.total)}</p>
                    {cancelled ? <span className="text-[10px] font-bold text-destructive">Annulée</span> : <MethodBadge method={s.method} />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <SaleDetailSheet saleId={selectedSaleId} onClose={() => setSelectedSaleId(null)} />
      <OpenDaySheet open={openSheetVisible} onClose={() => setOpenSheetVisible(false)} onOpened={() => { void qc.invalidateQueries({ queryKey: ["daySession"] }); }} />
      <CloseDaySheet open={closeSheetVisible} onClose={() => setCloseSheetVisible(false)} sales={sales} expenses={expenses} onClosed={() => { void qc.invalidateQueries({ queryKey: ["daySession"] }); }} />
    </AppLayout>
  );
}

function OpenDaySheet({ open, onClose, onOpened }: { open: boolean; onClose: () => void; onOpened: () => void }) {
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await openDaySessionApi();
      toast.success("Journée ouverte");
      onOpened();
      onClose();
    } catch { toast.error("Impossible d'ouvrir la journée."); }
    finally { setLoading(false); }
  };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <BottomSheet open={open} onClose={onClose} title="Ouvrir la journée" subtitle="Démarrer une nouvelle journée de caisse">
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Date</span><span className="font-semibold capitalize text-foreground">{dateStr}</span></div>
          <div className="mt-1 flex justify-between text-sm"><span className="text-muted-foreground">Heure d'ouverture</span><span className="font-bold text-foreground">{timeStr}</span></div>
        </div>
        <button onClick={submit} disabled={loading} className="w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60">
          {loading ? "Ouverture…" : "Ouvrir la journée"}
        </button>
      </div>
    </BottomSheet>
  );
}

function CloseDaySheet({ open, onClose, sales, expenses, onClosed }: { open: boolean; onClose: () => void; sales: SaleEntry[]; expenses: Expense[]; onClosed: () => void }) {
  const [counted, setCounted] = useState("");
  const [loading, setLoading] = useState(false);

  const totalCA = sales.filter((s) => s.status !== "Annulée").reduce((s, v) => s + v.total, 0);
  const cashRevenue = sales.filter((v) => v.method !== "Crédit").reduce((s, v) => s + v.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const soldeTheorique = cashRevenue - totalExpenses;
  const countedNum = parseInt(counted || "0", 10);
  const ecart = countedNum - soldeTheorique;

  const submit = async () => {
    setLoading(true);
    try {
      await closeDaySessionApi({ countedAmount: countedNum || undefined });
      toast.success("Journée clôturée avec succès");
      onClosed();
      setCounted("");
      onClose();
    } catch { toast.error("Impossible de clôturer la journée."); }
    finally { setLoading(false); }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Clôturer la journée" subtitle="Récapitulatif et fermeture de caisse">
      <div className="space-y-3">
        <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Chiffre d'affaires</span><span className="font-bold tabular-nums text-foreground">{fcfa(totalCA)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nombre de ventes</span><span className="font-bold text-foreground">{sales.length}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Entrées caisse</span><span className="font-bold tabular-nums text-foreground">{fcfa(cashRevenue)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dépenses ({expenses.length})</span><span className="font-bold tabular-nums text-destructive">- {fcfa(totalExpenses)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-sm"><span className="font-semibold text-foreground">Solde théorique</span><span className="font-bold tabular-nums text-primary">{fcfa(soldeTheorique)}</span></div>
        </div>
        <Field label="Montant compté en caisse (F)">
          <input inputMode="numeric" value={counted} onChange={(e) => setCounted(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="Ex. 184 500" />
        </Field>
        {counted !== "" && (
          <div className={cn("flex justify-between rounded-xl px-4 py-3 text-sm font-bold", ecart === 0 ? "bg-success/10 text-success" : ecart > 0 ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive")}>
            <span>Écart de caisse</span>
            <span className="tabular-nums">{ecart >= 0 ? "+" : ""}{fcfa(ecart)}</span>
          </div>
        )}
        <button onClick={submit} disabled={loading} className="w-full rounded-2xl bg-destructive py-3.5 text-base font-bold text-white shadow-elevated active:scale-[0.99] disabled:opacity-60">
          {loading ? "Clôture…" : "Clôturer la journée"}
        </button>
      </div>
    </BottomSheet>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] text-primary-foreground/70">{label}</p><p className="font-display text-base font-bold tabular-nums">{value}</p></div>;
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
  return <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${map[method] ?? "bg-muted text-muted-foreground"}`}>{method}</span>;
}

// Keep for compatibility with other routes that import METHOD_LABEL
export { METHOD_LABEL };
