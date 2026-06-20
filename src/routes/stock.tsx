import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, AlertTriangle, PackageX, X } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AddDrinkSheet } from "@/components/AddDrinkSheet";
import { cn } from "@/lib/utils";
import { CATEGORIES, fcfa } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock & catalogue — Caisse+" },
      { name: "description", content: "Suivi du stock de boissons en temps réel avec alertes de seuil et ruptures." },
    ],
  }),
  component: Stock,
});

function Stock() {
  const { drinks } = useStore();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Toutes");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return drinks.filter((d) => {
      if (activeCat !== "Toutes" && d.category !== activeCat) return false;
      if (terms.length === 0) return true;
      const haystack = normalize(`${d.name} ${d.category} ${d.size}`);
      return terms.every((t) => haystack.includes(t));
    });
  }, [drinks, query, activeCat]);

  const out = drinks.filter((d) => d.stock === 0).length;
  const low = drinks.filter((d) => d.stock > 0 && d.stock <= d.threshold).length;
  const value = drinks.reduce((s, d) => s + d.stock * d.cost, 0);

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Stock & catalogue</h1>
            <p className="text-xs text-muted-foreground">{drinks.length} références actives</p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Boisson
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-card">
            <p className="font-display text-lg font-extrabold text-foreground">{fcfa(value)}</p>
            <p className="text-[11px] text-muted-foreground">Valeur stock</p>
          </div>
          <div className="rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-center">
            <p className="font-display text-lg font-extrabold text-secondary">{low}</p>
            <p className="text-[11px] text-muted-foreground">Sous seuil</p>
          </div>
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-center">
            <p className="font-display text-lg font-extrabold text-destructive">{out}</p>
            <p className="text-[11px] text-muted-foreground">Ruptures</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-card focus-within:border-primary">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom, format, catégorie…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Effacer la recherche"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-95"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {(query || activeCat !== "Toutes") && (
          <p className="-mt-1 text-xs text-muted-foreground">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            {activeCat !== "Toutes" && ` · ${activeCat}`}
          </p>
        )}

        {/* Categories */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {["Toutes", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                activeCat === cat ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.map((d) => {
            const soldOut = d.stock === 0;
            const lowStock = d.stock > 0 && d.stock <= d.threshold;
            const ratio = Math.min(100, (d.stock / (d.threshold * 3)) * 100);
            return (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{d.emoji}</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.size} · {d.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-extrabold tabular-nums text-foreground">{d.stock}</p>
                    <p className="text-[11px] text-muted-foreground">seuil {d.threshold}</p>
                  </div>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", soldOut ? "bg-destructive" : lowStock ? "bg-secondary" : "bg-primary")}
                    style={{ width: `${soldOut ? 100 : ratio}%` }}
                  />
                </div>
                {(soldOut || lowStock) && (
                  <p className={cn("mt-2 flex items-center gap-1 text-xs font-semibold", soldOut ? "text-destructive" : "text-secondary")}>
                    {soldOut ? <PackageX className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    {soldOut ? "Rupture de stock — réapprovisionner" : "Stock bas — bientôt en rupture"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AddDrinkSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </AppLayout>
  );
}
