import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Trophy, Clock, FileDown, Share2, FileText } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { DrinkImage } from "@/components/DrinkImage";
import { BottomSheet, Field } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { fcfa, WEEK_SALES } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { getSalesApi, getDrinksApi } from "@/lib/graphql/operations";
import { SectionTitle, MethodBadge } from "./index";
import { downloadReportPDF, shareReportPDF, type ReportSection } from "@/lib/export-pdf";

export const Route = createFileRoute("/journal")({
  component: Journal,
});

const periods = ["Jour", "Semaine", "Mois"] as const;
const dataTypes = ["Synthèse", "Ventes détaillées", "Boissons rentables", "Tout"] as const;

function Journal() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("Jour");
  const { establishment, currentRole } = useStore();
  const isOwner = currentRole === "Propriétaire";

  const { data: sales = [] } = useQuery({ queryKey: ["sales"], queryFn: () => getSalesApi(200) });
  const { data: drinks = [] } = useQuery({ queryKey: ["drinks"], queryFn: () => getDrinksApi() });

  const [exportOpen, setExportOpen] = useState(false);
  const [expPeriod, setExpPeriod] = useState<(typeof periods)[number]>("Jour");
  const [expType, setExpType] = useState<(typeof dataTypes)[number]>("Synthèse");

  const ca = sales.reduce((s, v) => s + v.total, 0);
  const benefice = Math.round(ca * 0.367);

  const topDrinks = [...drinks]
    .map((d) => ({ ...d, margin: d.price - d.cost }))
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 5);
  const maxBar = Math.max(...WEEK_SALES.map((w) => w.value), 1);

  const buildSections = (type: (typeof dataTypes)[number]): ReportSection[] => {
    const sections: ReportSection[] = [];
    if (type === "Ventes détaillées" || type === "Tout") {
      sections.push({
        heading: "Historique des ventes",
        columns: [
          { header: "Ticket", key: "id", width: 1 },
          { header: "Table", key: "table", width: 1.2 },
          { header: "Serveur", key: "server", width: 1.2 },
          { header: "Heure", key: "time", width: 0.9 },
          { header: "Mode", key: "method", width: 1.3 },
          { header: "Montant", key: "total", align: "right", width: 1.1 },
        ],
        rows: sales.map((s) => ({ id: s.id, table: s.table, server: s.server, time: s.time, method: s.method, total: fcfa(s.total) })),
      });
    }
    if (type === "Boissons rentables" || type === "Tout") {
      sections.push({
        heading: "Top boissons rentables",
        columns: [
          { header: "#", key: "rank", width: 0.4 },
          { header: "Boisson", key: "name", width: 2 },
          { header: "Format", key: "size", width: 1 },
          { header: "Prix", key: "price", align: "right", width: 1 },
          { header: "Marge / unité", key: "margin", align: "right", width: 1.2 },
        ],
        rows: topDrinks.map((d, i) => ({ rank: String(i + 1), name: d.name, size: d.size, price: fcfa(d.price), margin: fcfa(d.margin) })),
      });
    }
    if (type === "Synthèse" || type === "Tout") {
      sections.unshift({
        heading: "Ventes par jour",
        columns: [
          { header: "Jour", key: "day", width: 2 },
          { header: "Ventes (k F)", key: "value", align: "right", width: 1 },
        ],
        rows: WEEK_SALES.map((w) => ({ day: w.day, value: String(w.value) })),
      });
    }
    return sections;
  };

  const estabName = establishment?.name ?? "Caisse+";

  const meta = (type: (typeof dataTypes)[number], per: (typeof periods)[number]) => ({
    title: "Journal & rapports",
    establishment: estabName,
    period: per,
    dataType: type,
    summary: isOwner
      ? [
          { label: "Chiffre d'affaires", value: fcfa(ca) },
          { label: "Bénéfice net", value: fcfa(benefice) },
          { label: "Marge", value: "36,7 %" },
        ]
      : [
          { label: "Chiffre d'affaires", value: fcfa(ca) },
          { label: "Nombre de ventes", value: String(sales.length) },
        ],
  });

  const visibleDataTypes = isOwner ? dataTypes : (["Synthèse", "Ventes détaillées", "Tout"] as const);

  const handleDownload = () => {
    downloadReportPDF(meta(expType, expPeriod), buildSections(expType));
    toast.success("PDF généré", { description: `${expType} · ${expPeriod}` });
    setExportOpen(false);
  };

  const handleShare = async () => {
    try {
      const res = await shareReportPDF(meta(expType, expPeriod), buildSections(expType));
      toast.success(res === "shared" ? "Rapport partagé" : "PDF téléchargé", { description: `${expType} · ${expPeriod}` });
      setExportOpen(false);
    } catch {
      toast.error("Partage annulé");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-foreground">Journal & rapports</h1>
            <p className="text-xs text-muted-foreground">Suivi détaillé de l'activité</p>
          </div>
          <button
            onClick={() => { setExpPeriod(period); setExportOpen(true); }}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-card active:scale-[0.98]"
          >
            <FileDown className="h-4 w-4" /> Export PDF
          </button>
        </div>

        <div className="flex rounded-2xl bg-muted p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn("flex-1 rounded-xl py-2 text-sm font-semibold transition-colors", period === p ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
            <p className="mt-0.5 font-display text-xl font-extrabold tabular-nums text-foreground">{fcfa(ca)}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-success">
              <TrendingUp className="h-3 w-3" /> {sales.length} ventes
            </span>
          </div>
          {isOwner ? (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Bénéfice net estimé</p>
              <p className="mt-0.5 font-display text-xl font-extrabold tabular-nums text-primary">{fcfa(benefice)}</p>
              <span className="mt-1 inline-block text-[11px] text-muted-foreground">Marge ~36,7 %</span>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Nombre de ventes</p>
              <p className="mt-0.5 font-display text-xl font-extrabold tabular-nums text-foreground">{sales.length}</p>
              <span className="mt-1 inline-block text-[11px] text-muted-foreground">Transactions du jour</span>
            </div>
          )}
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <SectionTitle title="Ventes par jour" />
          <div className="flex h-32 items-end justify-between gap-2">
            {WEEK_SALES.map((w, i) => (
              <div key={w.day} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{w.value}</span>
                <div
                  className={`w-full rounded-t-lg ${i === 5 ? "bg-secondary" : "bg-primary/80"}`}
                  style={{ height: `${(w.value / maxBar) * 100}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{w.day}</span>
              </div>
            ))}
          </div>
        </section>

        {isOwner && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-secondary" />
              <SectionTitle title="Top boissons rentables" noMargin />
            </div>
            <div className="space-y-2">
              {topDrinks.map((d, i) => (
                <div key={d.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <DrinkImage value={d.emoji} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.size}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums text-success">+{fcfa(d.margin)}</p>
                    <p className="text-[11px] text-muted-foreground">marge / unité</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <SectionTitle title="Historique des ventes" noMargin />
          </div>
          <div className="space-y-2">
            {sales.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.id} · {s.table}</p>
                  <p className="text-xs text-muted-foreground">{s.time} · {s.server} · {s.items} articles</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-foreground">{fcfa(s.total)}</p>
                  <MethodBadge method={s.method} />
                </div>
              </div>
            ))}
            {sales.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune vente enregistrée.</p>
            )}
          </div>
        </section>
      </div>

      <BottomSheet open={exportOpen} onClose={() => setExportOpen(false)} title="Exporter en PDF" subtitle="Choisis la période et le type de données">
        <div className="space-y-4">
          <Field label="Période">
            <div className="flex gap-2">
              {periods.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setExpPeriod(p)}
                  className={cn("flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors", expPeriod === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground")}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Type de données">
            <div className="grid grid-cols-2 gap-2">
              {visibleDataTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setExpType(t)}
                  className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors", expType === t ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground")}
                >
                  <FileText className="h-4 w-4 shrink-0" /> {t}
                </button>
              ))}
            </div>
          </Field>

          <div className="rounded-2xl bg-muted p-4 text-xs text-muted-foreground">
            Rapport <span className="font-bold text-foreground">{expType}</span> sur la période{" "}
            <span className="font-bold text-foreground">{expPeriod}</span> pour {estabName}.
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-muted py-3.5 text-sm font-bold text-foreground active:scale-[0.99]"
            >
              <Share2 className="h-4 w-4" /> Partager
            </button>
            <button
              onClick={handleDownload}
              className="flex flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
            >
              <FileDown className="h-4 w-4" /> Télécharger le PDF
            </button>
          </div>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
