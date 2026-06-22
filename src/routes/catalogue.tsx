import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { AddDrinkSheet } from "@/components/AddDrinkSheet";
import { DrinkImage } from "@/components/DrinkImage";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { CATEGORIES, fcfa, type Category } from "@/lib/mock-data";
import { getDrinksApi, updateDrinkApi, deleteDrinkApi } from "@/lib/graphql/operations";
import { CATEGORY_KEY } from "@/lib/graphql/adapters";
import { useStore } from "@/lib/store";
import type { Drink } from "@/lib/mock-data";

export const Route = createFileRoute("/catalogue")({
  component: Catalogue,
});

function Catalogue() {
  const qc = useQueryClient();
  const { currentRole } = useStore();
  const isOwner = currentRole === "Propriétaire";
  const { data: drinks = [] } = useQuery({ queryKey: ["drinks"], queryFn: () => getDrinksApi() });

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("Toutes");

  // Edit sheet state
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Drink | null>(null);
  const [eName, setEName] = useState("");
  const [eCategory, setECategory] = useState<Category>("Bières");
  const [eSize, setESize] = useState("");
  const [ePrice, setEPrice] = useState("");
  const [eCost, setECost] = useState("");
  const [eThreshold, setEThreshold] = useState("");

  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateDrinkApi>[1] }) =>
      updateDrinkApi(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["drinks"] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteDrinkApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["drinks"] }),
  });

  const openEdit = (d: Drink) => {
    setEditing(d);
    setEName(d.name);
    setECategory(d.category);
    setESize(d.size);
    setEPrice(String(d.price));
    setECost(String(d.cost));
    setEThreshold(String(d.threshold));
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing || !eName.trim() || !ePrice) {
      toast.error("Nom et prix sont obligatoires.");
      return;
    }
    try {
      await updateMut.mutateAsync({
        id: editing.id,
        input: {
          name: eName.trim(),
          category: CATEGORY_KEY[eCategory] ?? eCategory,
          size: eSize.trim() || undefined,
          price: parseInt(ePrice, 10),
          cost: eCost ? parseInt(eCost, 10) : undefined,
          threshold: eThreshold ? parseInt(eThreshold, 10) : undefined,
        },
      });
      toast.success(`${eName.trim()} mis à jour`);
      setEditOpen(false);
    } catch {
      toast.error("Impossible de modifier la boisson.");
    }
  };

  const handleDelete = async (d: Drink) => {
    if (!confirm(`Supprimer "${d.name}" du catalogue ?`)) return;
    try {
      await deleteMut.mutateAsync(d.id);
      toast.success(`${d.name} retiré du catalogue`);
    } catch {
      toast.error("Impossible de supprimer la boisson.");
    }
  };

  const filtered = useMemo(
    () => drinks.filter((d) =>
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
          {isOwner && (
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Boisson
            </button>
          )}
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
              <div key={d.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <DrinkImage value={d.emoji} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.size} · {d.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="font-display text-base font-extrabold tabular-nums text-primary">{fcfa(d.price)}</p>
                    {isOwner && (
                      <p className="text-[11px] font-semibold text-success">+{fcfa(margin)} · {pct}%</p>
                    )}
                  </div>
                  {isOwner && (
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => openEdit(d)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary active:scale-95"
                        aria-label="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => void handleDelete(d)}
                        disabled={deleteMut.isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive active:scale-95 disabled:opacity-40"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Aucune boisson trouvée.</p>
          )}
        </div>
      </div>

      {isOwner && <AddDrinkSheet open={open} onClose={() => setOpen(false)} />}

      <BottomSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier la boisson"
        subtitle={editing?.name ?? ""}
      >
        <div className="space-y-3">
          <Field label="Nom">
            <input value={eName} onChange={(e) => setEName(e.target.value)} className={inputClass} placeholder="Ex. Heineken 65cl" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select
                value={eCategory}
                onChange={(e) => setECategory(e.target.value as Category)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Format">
              <input value={eSize} onChange={(e) => setESize(e.target.value)} className={inputClass} placeholder="Ex. 65cl" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix de vente (F)">
              <input inputMode="numeric" value={ePrice} onChange={(e) => setEPrice(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="0" />
            </Field>
            <Field label="Prix de revient (F)">
              <input inputMode="numeric" value={eCost} onChange={(e) => setECost(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="0" />
            </Field>
          </div>
          <Field label="Seuil d'alerte stock">
            <input inputMode="numeric" value={eThreshold} onChange={(e) => setEThreshold(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="Ex. 5" />
          </Field>
          <button
            onClick={submitEdit}
            disabled={updateMut.isPending}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
          >
            {updateMut.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
