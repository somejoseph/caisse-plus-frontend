import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, PackagePlus, AlertTriangle, PackageX, Building2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { fcfa, type Drink } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/approvisionnement")({
  head: () => ({
    meta: [
      { title: "Approvisionnement — Caisse+" },
      { name: "description", content: "Réceptionnez vos livraisons et réapprovisionnez les boissons en rupture ou sous le seuil." },
    ],
  }),
  component: Approvisionnement,
});

function Approvisionnement() {
  const { drinks, suppliers, restockDrink } = useStore();
  const [target, setTarget] = useState<Drink | null>(null);
  const [qty, setQty] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const toRestock = useMemo(
    () => [...drinks].filter((d) => d.stock <= d.threshold).sort((a, b) => a.stock - b.stock),
    [drinks],
  );

  const open = (d: Drink) => {
    setTarget(d);
    setQty("");
    setUnitCost(String(d.cost));
    setSupplierId(suppliers[0]?.id ?? "");
  };

  const qtyN = parseInt(qty || "0", 10);
  const costN = parseInt(unitCost || "0", 10);
  const totalCost = qtyN * costN;

  const submit = () => {
    if (!target) return;
    if (qtyN <= 0) {
      toast.error("Saisis une quantité valide.");
      return;
    }
    const supplier = suppliers.find((s) => s.id === supplierId)?.name;
    restockDrink(target.id, qtyN, costN, supplier);
    toast.success(`${target.name} réceptionnée (+${qtyN})`, {
      description: `Coût total ${fcfa(totalCost)}${supplier ? ` · ${supplier}` : ""}`,
    });
    setTarget(null);
    setQty("");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-foreground">Approvisionnement</h1>
            <p className="text-xs text-muted-foreground">Réceptionner les livraisons & réapprovisionner</p>
          </div>
          <Link
            to="/fournisseurs"
            className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-2 text-xs font-bold text-foreground"
          >
            <Building2 className="h-4 w-4 text-primary" /> Fournisseurs
          </Link>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-brand-gradient p-4 text-primary-foreground shadow-card">
          <Truck className="h-7 w-7" />
          <div>
            <p className="text-sm font-semibold">{toRestock.length} référence(s) à réapprovisionner</p>
            <p className="text-xs text-primary-foreground/80">Touchez une boisson pour enregistrer une réception</p>
          </div>
        </div>

        <div className="space-y-2">
          {toRestock.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">Tous les stocks sont au-dessus du seuil 🎉</p>
          )}
          {toRestock.map((d) => {
            const out = d.stock === 0;
            return (
              <button
                key={d.id}
                onClick={() => open(d)}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-card active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{d.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{d.name}</p>
                    <p className={cn("flex items-center gap-1 text-xs font-semibold", out ? "text-destructive" : "text-warning")}>
                      {out ? <PackageX className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {out ? "Rupture" : `Stock ${d.stock} · seuil ${d.threshold}`}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                  <PackagePlus className="h-4 w-4" /> Réceptionner
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <BottomSheet
        open={!!target}
        onClose={() => setTarget(null)}
        title={target ? `Réception · ${target.name}` : ""}
        subtitle={target ? `${target.size} · stock actuel ${target.stock}` : ""}
      >
        <div className="space-y-3">
          <Field label="Quantité reçue">
            <input
              autoFocus
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
              className={inputClass}
              placeholder="Ex. 48"
            />
          </Field>

          <Field label="Prix unitaire (coût d'achat)">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 focus-within:border-primary">
              <input
                inputMode="numeric"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none"
                placeholder="Ex. 650"
              />
              <span className="text-sm font-semibold text-muted-foreground">F</span>
            </div>
          </Field>

          {suppliers.length > 0 && (
            <Field label="Fournisseur">
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={inputClass}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <div className="rounded-2xl bg-muted p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nouveau stock</span>
              <span className="font-bold text-foreground">{target ? target.stock + qtyN : 0}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
              <span className="text-muted-foreground">Coût total (auto)</span>
              <span className="font-display text-lg font-extrabold tabular-nums text-primary">{fcfa(totalCost)}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {qtyN || 0} × {fcfa(costN)} — recalculé en temps réel
            </p>
          </div>

          <button
            onClick={submit}
            className="mt-1 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
          >
            Valider la réception
          </button>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
