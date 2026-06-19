import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Truck, PackagePlus, AlertTriangle, PackageX } from "lucide-react";
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
  const { drinks, restockDrink } = useStore();
  const [target, setTarget] = useState<Drink | null>(null);
  const [qty, setQty] = useState("");

  const toRestock = useMemo(
    () => [...drinks].filter((d) => d.stock <= d.threshold).sort((a, b) => a.stock - b.stock),
    [drinks],
  );

  const submit = () => {
    if (!target) return;
    const n = parseInt(qty || "0", 10);
    if (n <= 0) {
      toast.error("Saisis une quantité valide.");
      return;
    }
    restockDrink(target.id, n);
    toast.success(`${target.name} réapprovisionnée (+${n})`);
    setTarget(null);
    setQty("");
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Approvisionnement</h1>
          <p className="text-xs text-muted-foreground">Réceptionner les livraisons & réapprovisionner</p>
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
                onClick={() => {
                  setTarget(d);
                  setQty("");
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-card active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{d.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{d.name}</p>
                    <p className={cn("flex items-center gap-1 text-xs font-semibold", out ? "text-destructive" : "text-secondary")}>
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
          {target && qty && (
            <p className="text-sm text-muted-foreground">
              Nouveau stock : <span className="font-bold text-foreground">{target.stock + parseInt(qty || "0", 10)}</span> · Coût&nbsp;
              <span className="font-bold text-foreground">{fcfa(target.cost * parseInt(qty || "0", 10))}</span>
            </p>
          )}
          <button
            onClick={submit}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
          >
            Valider la réception
          </button>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
