import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Minus, Plus, ShoppingCart, X, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { DrinkImage } from "@/components/DrinkImage";
import { cn } from "@/lib/utils";
import { CATEGORIES, fcfa, type Drink } from "@/lib/mock-data";
import {
  getDrinksApi, getServersApi, getTablesApi, getCurrentDaySessionApi, recordSaleApi, getUsersApi,
} from "@/lib/graphql/operations";
import { METHOD_KEY } from "@/lib/graphql/adapters";
import { useStore } from "@/lib/store";
import type { TableItem } from "@/lib/store";

export const Route = createFileRoute("/ventes")({
  component: Ventes,
});

const methods = ["Espèces", "Mobile Money", "Crédit"] as const;

function Ventes() {
  const qc = useQueryClient();
  const { currentRole, currentUserName } = useStore();
  const { data: drinks = [] } = useQuery({ queryKey: ["drinks"], queryFn: () => getDrinksApi() });
  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: getServersApi });
  const { data: tables = [] } = useQuery({ queryKey: ["tables"], queryFn: getTablesApi });
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: getUsersApi });
  const { data: daySession } = useQuery({ queryKey: ["daySession"], queryFn: getCurrentDaySessionApi });
  const dayOpen = !!daySession;

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("Toutes");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);

  const recordSaleMut = useMutation({
    mutationFn: recordSaleApi,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sales"] });
      void qc.invalidateQueries({ queryKey: ["drinks"] });
    },
  });

  const filtered = useMemo(
    () => drinks.filter((d) => {
      const matchCat = activeCat === "Toutes" || d.category === activeCat;
      const matchQ = d.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    }),
    [drinks, query, activeCat],
  );

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const remove = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      if (!next[id]) return next;
      next[id] -= 1;
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const cartLines = Object.entries(cart)
    .map(([id, qty]) => ({ drink: drinks.find((d) => d.id === id)!, qty }))
    .filter((l) => l.drink);
  const total = cartLines.reduce((s, l) => s + l.drink.price * l.qty, 0);
  const count = cartLines.reduce((s, l) => s + l.qty, 0);

  const activeServers = servers.filter((s) => s.active);
  const activeGerants = users.filter((u) => u.active && u.role === "Gérant");
  // Option "Moi" en tête de liste si l'utilisateur connecté est un gérant
  const moiEntry = currentRole === "Gérant" && currentUserName
    ? [{ id: "moi", name: "Moi", isGerant: true }]
    : [];
  const allStaff = [
    ...moiEntry,
    ...activeServers.map((s) => ({ id: s.id, name: s.name, isGerant: false })),
    ...activeGerants.map((g) => ({ id: g.id, name: g.name, isGerant: true })),
  ];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold leading-tight text-foreground">Point de vente</h1>
            <p className="text-xs text-muted-foreground">Table & serveur à associer au paiement</p>
          </div>
        </div>

        {!dayOpen && (
          <div className="flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-xs font-semibold text-accent">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Journée non ouverte — ouvrez la caisse depuis l'accueil avant de vendre.
          </div>
        )}

        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-card">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une boisson…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {["Toutes", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                activeCat === cat
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "border border-border bg-card text-muted-foreground",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((d) => (
            <ProductCard key={d.id} drink={d} qty={cart[d.id] ?? 0} onAdd={() => add(d.id)} onRemove={() => remove(d.id)} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">Aucune boisson trouvée.</p>
          )}
        </div>
      </div>

      {count > 0 && !checkout && (
        <button
          onClick={() => setCheckout(true)}
          className="fixed bottom-24 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-[28rem] -translate-x-1/2 items-center justify-between rounded-2xl bg-brand-gradient px-5 py-3.5 text-primary-foreground shadow-elevated active:scale-[0.99]"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
              <ShoppingCart className="h-4 w-4" />
            </span>
            {count} article{count > 1 ? "s" : ""}
          </span>
          <span className="font-display text-lg font-extrabold tabular-nums">{fcfa(total)}</span>
        </button>
      )}

      {checkout && (
        <CheckoutSheet
          lines={cartLines}
          total={total}
          tables={tables}
          servers={allStaff.map((s) => s.name)}
          onClose={() => setCheckout(false)}
          onAdd={add}
          onRemove={remove}
          onConfirm={async (tableName, serverName, method) => {
            try {
              const resolvedName = serverName === "Moi" ? (currentUserName ?? serverName) : serverName;
              const staffMember = allStaff.find((s) => s.name === serverName);
              const table = tables.find((t) => t.name === tableName);
              const serverId = staffMember?.isGerant ? undefined : staffMember?.id;
              await recordSaleMut.mutateAsync({
                items: cartLines.map((l) => ({ drinkId: l.drink.id, quantity: l.qty })),
                tableName,
                serverName: resolvedName,
                tableId: table?.id,
                serverId,
                method: METHOD_KEY[method] ?? method,
              });
              toast.success("Vente encaissée", { description: `${fcfa(total)} · ${method}` });
              setCart({});
              setCheckout(false);
            } catch {
              toast.error("Erreur lors de l'enregistrement de la vente.");
            }
          }}
        />
      )}
    </AppLayout>
  );
}

function ProductCard({
  drink, qty, onAdd, onRemove,
}: {
  drink: Drink; qty: number; onAdd: () => void; onRemove: () => void;
}) {
  const soldOut = drink.stock === 0;
  const low = drink.stock > 0 && drink.stock <= drink.threshold;
  return (
    <div className={cn("relative flex flex-col rounded-2xl border bg-card p-3 shadow-card", soldOut && "opacity-60")}>
      <div className="flex items-start justify-between">
        <DrinkImage value={drink.emoji} size="lg" />
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", soldOut ? "bg-destructive/10 text-destructive" : low ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground")}>
          {soldOut ? "Rupture" : `Stock ${drink.stock}`}
        </span>
      </div>
      <p className="mt-2 text-sm font-bold leading-tight text-foreground">{drink.name}</p>
      <p className="text-xs text-muted-foreground">{drink.size}</p>
      <p className="mt-1 font-display text-base font-extrabold tabular-nums text-primary">{fcfa(drink.price)}</p>
      <div className="mt-3">
        {qty === 0 ? (
          <button
            disabled={soldOut}
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1 rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-muted p-1">
            <button onClick={onRemove} className="flex h-8 w-8 items-center justify-center rounded-lg bg-card text-foreground shadow-card">
              <Minus className="h-4 w-4" />
            </button>
            <span className="font-bold tabular-nums text-foreground">{qty}</span>
            <button
              disabled={qty >= drink.stock}
              onClick={onAdd}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutSheet({
  lines, total, tables, servers, onClose, onAdd, onRemove, onConfirm,
}: {
  lines: { drink: Drink; qty: number }[];
  total: number;
  tables: TableItem[];
  servers: string[];
  onClose: () => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onConfirm: (table: string, server: string, method: (typeof methods)[number]) => Promise<void>;
}) {
  const [method, setMethod] = useState<(typeof methods)[number]>("Espèces");
  const [table, setTable] = useState(tables[0]?.name ?? "Comptoir");
  const [server, setServer] = useState(servers[0] ?? "—");
  const [given, setGiven] = useState("");
  const [loading, setLoading] = useState(false);
  const givenNum = parseInt(given || "0", 10);
  const change = givenNum - total;

  const submit = async () => {
    setLoading(true);
    await onConfirm(table, server, method);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div className="relative mx-auto max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-5 no-scrollbar">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Valider la commande</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {lines.map(({ drink, qty }) => (
            <div key={drink.id} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
              <div className="flex items-center gap-2">
                <DrinkImage value={drink.emoji} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{drink.name}</p>
                  <p className="text-[11px] text-muted-foreground">{fcfa(drink.price)} × {qty}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onRemove(drink.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-card shadow-card">
                  {qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-destructive" /> : <Minus className="h-3.5 w-3.5" />}
                </button>
                <span className="w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
                <button onClick={() => onAdd(drink.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Table</span>
            <select value={table} onChange={(e) => setTable(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="Comptoir">Comptoir</option>
              {tables.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Serveur</span>
            <select value={server} onChange={(e) => setServer(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary">
              {servers.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Moyen de paiement</p>
          <div className="grid grid-cols-3 gap-2">
            {methods.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn("rounded-xl border px-2 py-2.5 text-xs font-bold transition-colors", method === m ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {method === "Espèces" && (
          <div className="mt-4 rounded-2xl bg-muted p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Montant remis</p>
            <input
              inputMode="numeric"
              value={given}
              onChange={(e) => setGiven(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className="w-full bg-transparent font-display text-2xl font-extrabold tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
            />
            {given && (
              <p className={cn("mt-1 text-sm font-bold", change >= 0 ? "text-success" : "text-destructive")}>
                {change >= 0 ? `Monnaie à rendre : ${fcfa(change)}` : `${fcfa(-change)} manquant`}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-gradient px-4 py-3 text-primary-foreground">
          <span className="text-sm font-semibold">Total à payer</span>
          <span className="font-display text-2xl font-extrabold tabular-nums">{fcfa(total)}</span>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
        >
          {loading ? "Encaissement…" : `Encaisser ${fcfa(total)}`}
        </button>
      </div>
    </div>
  );
}
