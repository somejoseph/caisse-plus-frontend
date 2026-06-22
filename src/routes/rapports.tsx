import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Calendar, FileDown, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { fcfa, ESTABLISHMENT } from "@/lib/mock-data";
import { AppLayout } from "@/components/AppLayout";
import { inputClass } from "@/components/BottomSheet";
import { useStore } from "@/lib/store";
import {
  getReportSalesApi, getReportExpensesApi, getReportDaySessionsApi,
  type ReportSale, type ReportExpense, type ReportSession,
} from "@/lib/graphql/operations";
import { shareReportPDF, type ReportMeta, type ReportSection } from "@/lib/export-pdf";

export const Route = createFileRoute("/rapports")({
  component: Rapports,
});

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

function fmtHm(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const OWNER_TABS = ["Synthèse", "Par vendeur", "Journées"] as const;
const GERANT_TABS = ["Synthèse"] as const;
type Tab = "Synthèse" | "Par vendeur" | "Journées";

const SHORTCUTS = [
  { key: "today", label: "Auj." },
  { key: "7d", label: "7 jours" },
  { key: "month", label: "Ce mois" },
  { key: "3m", label: "3 mois" },
  { key: "year", label: "Cette année" },
] as const;

function Rapports() {
  const navigate = useNavigate();
  const { currentRole, currentUserName } = useStore();
  const isOwner = currentRole === "Propriétaire";

  useEffect(() => {
    if (currentRole && currentRole !== "Propriétaire" && currentRole !== "Gérant") {
      void navigate({ to: "/" });
    }
  }, [currentRole, navigate]);

  const today = new Date();
  const [from, setFrom] = useState(isoDate(today));
  const [to, setTo] = useState(isoDate(today));
  const [tab, setTab] = useState<Tab>("Synthèse");
  const [activeShortcut, setActiveShortcut] = useState<string>("today");

  const salesQ = useQuery({ queryKey: ["reportSales", from, to], queryFn: () => getReportSalesApi({ from, to, limit: 5000 }) });
  const expensesQ = useQuery({ queryKey: ["reportExpenses", from, to], queryFn: () => getReportExpensesApi({ from, to, limit: 5000 }) });
  const sessionsQ = useQuery({ queryKey: ["reportSessions", from, to], queryFn: () => getReportDaySessionsApi({ from, to, limit: 500 }) });

  const allSales: ReportSale[] = salesQ.data ?? [];
  const allExpenses: ReportExpense[] = expensesQ.data ?? [];
  const sessions: ReportSession[] = sessionsQ.data ?? [];

  // Gérant voit uniquement ses propres données
  const sales = isOwner ? allSales : allSales.filter((s) => s.server === currentUserName);
  const expenses = isOwner ? allExpenses : allExpenses.filter((e) => e.createdByName === currentUserName);
  const isLoading = salesQ.isLoading || expensesQ.isLoading || sessionsQ.isLoading;

  const totalCA = sales.reduce((s, v) => s + v.total, 0);
  const cashRevenue = sales.filter((s) => s.method !== "Crédit").reduce((s, v) => s + v.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const soldeNet = cashRevenue - totalExpenses;

  const breakdown = (["Espèces", "Mobile Money", "Crédit"] as const).map((m) => ({
    method: m,
    amount: sales.filter((s) => s.method === m).reduce((a, s) => a + s.total, 0),
    count: sales.filter((s) => s.method === m).length,
    bar: m === "Espèces" ? "bg-primary" : m === "Mobile Money" ? "bg-secondary" : "bg-accent",
  }));

  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]);

  const byServer = Object.values(
    sales.reduce<Record<string, { name: string; count: number; ca: number; especes: number; mobile: number; credit: number }>>(
      (acc, s) => {
        const key = s.server || "Sans serveur";
        if (!acc[key]) acc[key] = { name: key, count: 0, ca: 0, especes: 0, mobile: 0, credit: 0 };
        acc[key].count++;
        acc[key].ca += s.total;
        if (s.method === "Espèces") acc[key].especes += s.total;
        else if (s.method === "Mobile Money") acc[key].mobile += s.total;
        else acc[key].credit += s.total;
        return acc;
      },
      {}
    )
  ).sort((a, b) => b.ca - a.ca);

  const applyShortcut = (key: string) => {
    const t = new Date();
    const froms: Record<string, Date> = {
      today: t,
      "7d": new Date(t.getTime() - 6 * 86400000),
      month: new Date(t.getFullYear(), t.getMonth(), 1),
      "3m": new Date(t.getFullYear(), t.getMonth() - 3, 1),
      year: new Date(t.getFullYear(), 0, 1),
    };
    setFrom(isoDate(froms[key] ?? t));
    setTo(isoDate(t));
    setActiveShortcut(key);
  };

  const handleExportPDF = () => {
    const fmtShort = (iso: string) =>
      new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    const periodLabel = from === to ? fmtShort(from) : `${fmtShort(from)} – ${fmtShort(to)}`;

    const meta: ReportMeta = {
      title: isOwner ? "Rapport & Bilan" : `Rapport de ${currentUserName}`,
      establishment: ESTABLISHMENT.name,
      period: periodLabel,
      dataType: isOwner ? "Vue propriétaire" : "Vue gérant",
      summary: [
        { label: "Chiffre d'affaires", value: fcfa(totalCA) },
        { label: "Solde encaissé", value: fcfa(cashRevenue) },
        { label: "Dépenses", value: fcfa(totalExpenses) },
        { label: "Solde net", value: fcfa(soldeNet) },
      ],
    };

    const sections: ReportSection[] = [];

    sections.push({
      heading: "Répartition des paiements",
      columns: [
        { header: "Mode", key: "method", width: 2 },
        { header: "Ventes", key: "count", align: "right" },
        { header: "Montant", key: "amount", align: "right", width: 2 },
      ],
      rows: breakdown.map((p) => ({ method: p.method, count: String(p.count), amount: fcfa(p.amount) })),
    });

    sections.push({
      heading: "Liste des ventes",
      columns: [
        { header: "Table", key: "table" },
        { header: "Vendeur", key: "server", width: 2 },
        { header: "Mode", key: "method" },
        { header: "Statut", key: "status" },
        { header: "Montant", key: "total", align: "right", width: 1.5 },
      ],
      rows: sales.map((s) => ({
        table: s.table || "—",
        server: s.server || "—",
        method: s.method,
        status: s.status,
        total: fcfa(s.total),
      })),
    });

    if (expenses.length > 0) {
      sections.push({
        heading: "Dépenses",
        columns: [
          { header: "Libellé", key: "label", width: 2 },
          { header: "Catégorie", key: "category" },
          { header: "Par", key: "createdBy" },
          { header: "Montant", key: "amount", align: "right" },
        ],
        rows: expenses.map((e) => ({
          label: e.label,
          category: e.category,
          createdBy: e.createdByName || "—",
          amount: fcfa(e.amount),
        })),
      });
    }

    if (isOwner && byServer.length > 0) {
      sections.push({
        heading: "Par vendeur",
        columns: [
          { header: "Vendeur", key: "name", width: 2 },
          { header: "Ventes", key: "count" },
          { header: "Espèces", key: "especes", align: "right" },
          { header: "Mobile", key: "mobile", align: "right" },
          { header: "Crédit", key: "credit", align: "right" },
          { header: "Total", key: "ca", align: "right" },
        ],
        rows: byServer.map((s) => ({
          name: s.name,
          count: String(s.count),
          especes: fcfa(s.especes),
          mobile: fcfa(s.mobile),
          credit: fcfa(s.credit),
          ca: fcfa(s.ca),
        })),
      });
    }

    if (isOwner && sessions.length > 0) {
      sections.push({
        heading: "Journées",
        columns: [
          { header: "Date", key: "date", width: 2 },
          { header: "Ouverture", key: "opened" },
          { header: "Clôture", key: "closed" },
          { header: "Compté", key: "counted", align: "right" },
          { header: "Écart", key: "ecart", align: "right" },
        ],
        rows: sessions.map((s) => ({
          date: new Date(s.openedAt).toLocaleDateString("fr-FR"),
          opened: fmtHm(s.openedAt),
          closed: s.closedAt ? fmtHm(s.closedAt) : "En cours",
          counted: s.countedAmount != null ? fcfa(s.countedAmount) : "—",
          ecart: s.ecart != null ? `${s.ecart >= 0 ? "+" : ""}${fcfa(s.ecart)}` : "—",
        })),
      });
    }

    void shareReportPDF(meta, sections);
  };

  if (currentRole && currentRole !== "Propriétaire" && currentRole !== "Gérant") return null;
  const tabs = isOwner ? OWNER_TABS : GERANT_TABS;

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-foreground">{isOwner ? "Rapports & Bilan" : "Mon rapport"}</h1>
            <p className="text-xs text-muted-foreground">
              {isOwner ? "Vue propriétaire — historique complet" : `Vos ventes et dépenses · ${currentUserName}`}
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-card active:scale-95"
          >
            <FileDown className="h-4 w-4" /> Exporter PDF
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {SHORTCUTS.map((s) => (
            <button
              key={s.key}
              onClick={() => applyShortcut(s.key)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold active:scale-95 transition-colors",
                activeShortcut === s.key
                  ? "border-primary bg-primary text-primary-foreground shadow-card"
                  : "border-border bg-card text-foreground shadow-card"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
            <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">Du</span>
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setActiveShortcut(""); }}
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none" />
          </div>
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
            <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">Au</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setActiveShortcut(""); }}
              className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none" />
          </div>
        </div>

        <div className="flex rounded-2xl bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-xl py-2 text-xs font-semibold transition-colors",
                tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        )}

        {!isLoading && tab === "Synthèse" && (
          <>
            <div className="rounded-3xl bg-brand-gradient p-5 text-primary-foreground shadow-elevated">
              <p className="text-sm text-primary-foreground/80">Chiffre d'affaires</p>
              <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{fcfa(totalCA)}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
                <div>
                  <p className="text-[11px] text-primary-foreground/70">Ventes</p>
                  <p className="font-display text-base font-bold">{sales.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-primary-foreground/70">Solde net</p>
                  <p className="font-display text-base font-bold tabular-nums">{fcfa(soldeNet)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-primary-foreground/70">Crédit</p>
                  <p className="font-display text-base font-bold tabular-nums">{fcfa(totalCA - cashRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-success/30 bg-success/10 p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-success/20">
                  <ArrowDownLeft className="h-5 w-5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Solde encaissé</p>
                <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-foreground">{fcfa(cashRevenue)}</p>
                <p className="text-[11px] text-muted-foreground">{sales.filter((s) => s.method !== "Crédit").length} ventes</p>
              </div>
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/20">
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                </div>
                <p className="text-xs text-muted-foreground">Dépenses</p>
                <p className="mt-0.5 font-display text-lg font-bold tabular-nums text-foreground">{fcfa(totalExpenses)}</p>
                <p className="text-[11px] text-muted-foreground">{expenses.length} opérations</p>
              </div>
            </div>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <h2 className="mb-3 text-sm font-bold text-foreground">Moyens de paiement</h2>
              <div className="space-y-3">
                {breakdown.map((p) => {
                  const pct = totalCA ? Math.round((p.amount / totalCA) * 100) : 0;
                  return (
                    <div key={p.method}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {p.method} <span className="text-xs opacity-70">({p.count})</span>
                        </span>
                        <span className="font-bold tabular-nums">{fcfa(p.amount)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${p.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {byCategory.length > 0 && (
              <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <h2 className="mb-3 text-sm font-bold text-foreground">Dépenses par catégorie</h2>
                <div className="space-y-2">
                  {byCategory.map(([cat, amt]) => (
                    <div key={cat} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Receipt className="h-3.5 w-3.5" /> {cat}
                      </span>
                      <span className="font-bold tabular-nums text-destructive">- {fcfa(amt)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {totalCA === 0 && expenses.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune donnée sur cette période.</p>
            )}
          </>
        )}

        {!isLoading && tab === "Par vendeur" && (
          <section className="space-y-2">
            {byServer.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune vente sur cette période.</p>
            )}
            {byServer.map((s) => (
              <div key={s.name} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-primary-foreground">
                      {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.count} vente{s.count > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <p className="font-display text-xl font-extrabold tabular-nums text-foreground">{fcfa(s.ca)}</p>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 border-t border-border pt-2 text-center text-[11px]">
                  <div>
                    <p className="text-muted-foreground">Espèces</p>
                    <p className="font-semibold tabular-nums text-primary">{fcfa(s.especes)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mobile</p>
                    <p className="font-semibold tabular-nums text-secondary">{fcfa(s.mobile)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Crédit</p>
                    <p className="font-semibold tabular-nums text-accent">{fcfa(s.credit)}</p>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {!isLoading && tab === "Journées" && (
          <section className="space-y-2">
            {sessions.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Aucune session sur cette période.</p>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-bold capitalize text-foreground">{fmtDay(s.openedAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        Ouverte {fmtHm(s.openedAt)}{s.openedByName ? ` · ${s.openedByName}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold",
                    s.closedAt ? "bg-muted text-muted-foreground" : "bg-success/10 text-success"
                  )}>
                    {s.closedAt ? "Clôturée" : "En cours"}
                  </span>
                </div>
                {s.closedAt && (
                  <div className="mt-2 grid grid-cols-3 gap-2 border-t border-border pt-2 text-center text-[11px]">
                    <div>
                      <p className="text-muted-foreground">Clôture</p>
                      <p className="font-semibold">{fmtHm(s.closedAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Compté</p>
                      <p className="font-semibold tabular-nums">{s.countedAmount != null ? fcfa(s.countedAmount) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Écart</p>
                      <p className={cn(
                        "font-bold tabular-nums",
                        s.ecart === 0 ? "text-success" : (s.ecart ?? 0) > 0 ? "text-secondary" : "text-destructive"
                      )}>
                        {s.ecart != null ? `${s.ecart >= 0 ? "+" : ""}${fcfa(s.ecart)}` : "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}
      </div>
    </AppLayout>
  );
}
