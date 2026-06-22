import { useQuery } from "@tanstack/react-query";
import { Clock, CreditCard, TableProperties, User, CheckCircle2, XCircle } from "lucide-react";
import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import { fcfa } from "@/lib/mock-data";
import { BottomSheet } from "@/components/BottomSheet";
import { MethodBadge } from "@/routes/index";
import { getSaleDetailApi } from "@/lib/graphql/operations";

export function SaleDetailSheet({ saleId, onClose }: { saleId: string | null; onClose: () => void }) {
  const { data: sale, isLoading } = useQuery({
    queryKey: ["saleDetail", saleId],
    queryFn: () => getSaleDetailApi(saleId!),
    enabled: !!saleId,
    staleTime: 60_000,
  });

  return (
    <BottomSheet
      open={!!saleId}
      onClose={onClose}
      title={sale ? `Ticket ${sale.ticketNumber}` : "Détail de la vente"}
      subtitle="Détail de la vente"
    >
      {isLoading && (
        <div className="py-10 text-center text-sm text-muted-foreground">Chargement…</div>
      )}

      {sale && (
        <div className="space-y-3">
          {/* Total */}
          <div className="rounded-2xl bg-brand-gradient p-4 text-center text-primary-foreground shadow-elevated">
            <p className="text-xs text-primary-foreground/80">Montant total</p>
            <p className="font-display text-4xl font-extrabold tabular-nums">{fcfa(sale.total)}</p>
          </div>

          {/* Infos */}
          <div className="space-y-2 rounded-2xl border border-border bg-card p-4 shadow-card">
            <Row icon={TableProperties} label="Table" value={sale.table} />
            <Row icon={User} label="Serveur" value={sale.server} />
            <Row icon={Clock} label="Heure" value={sale.time} />
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" /> Paiement
              </span>
              <MethodBadge method={sale.method as "Espèces" | "Mobile Money" | "Crédit"} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                {sale.status === "Payée"
                  ? <CheckCircle2 className="h-4 w-4 text-success" />
                  : <XCircle className="h-4 w-4 text-destructive" />
                }
                Statut
              </span>
              <span className={cn("font-bold", sale.status === "Payée" ? "text-success" : "text-destructive")}>
                {sale.status}
              </span>
            </div>
          </div>

          {/* Articles */}
          {sale.items.length > 0 && (
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              <p className="border-b border-border px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Articles ({sale.itemsCount})
              </p>
              <div className="divide-y divide-border">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.drinkName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.drinkSize} · {fcfa(item.unitPrice)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-bold tabular-nums text-foreground">{fcfa(item.subtotal)}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2.5">
                <p className="text-sm font-bold text-foreground">Total</p>
                <p className="font-display text-base font-extrabold tabular-nums text-foreground">{fcfa(sale.total)}</p>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-muted py-3.5 text-sm font-bold text-foreground active:scale-[0.99]"
          >
            Fermer
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

function Row({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
