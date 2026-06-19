import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { AddDrinkSheet } from "@/components/AddDrinkSheet";
import { cn } from "@/lib/utils";
import { CATEGORIES, fcfa } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "Catalogue boissons — Caisse+" },
      { name: "description", content: "Gérez votre carte : prix de vente, coûts et marges de toutes vos boissons." },
    ],
  }),
  component: Catalogue,
});

function Catalogue() {
  const { drinks } = useStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Toutes");

  const filtered = useMemo(
    () =>
      drinks.filter(
        (d) =>
          (activeCat === "Toutes" || d.category === activeCat) &&
          d.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [drinks, query, activeCat],
  );

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Catalogue boissons</h1>
            <p className="text-xs text-muted-foreground">{drinks.length} références · prix & marges</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Boisson
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-card">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

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

        <div className="space-y-2">
          {filtered.map((d) => {
            const margin = d.price - d.cost;
            const pct = d.price ? Math.round((margin / d.price) * 100) : 0;
            return (
              <div key={d.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{d.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.size} · {d.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-extrabold tabular-nums text-primary">{fcfa(d.price)}</p>
                  <p className="text-[11px] font-semibold text-success">+{fcfa(margin)} · {pct}%</p>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucune boisson trouvée.</p>
          )}
        </div>
      </div>

      <AddDrinkSheet open={open} onClose={() => setOpen(false)} />
    </AppLayout>
  );
}
