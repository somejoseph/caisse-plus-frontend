import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Phone, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { fcfa } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/serveurs")({
  head: () => ({
    meta: [
      { title: "Serveurs & tables — Caisse+" },
      { name: "description", content: "Gestion des serveurs et plan de salle visuel avec statut des tables." },
    ],
  }),
  component: Serveurs,
});

const tabs = ["Plan de salle", "Serveurs"] as const;

const statusStyle: Record<string, string> = {
  Libre: "border-success/40 bg-success/10 text-success",
  Occupée: "border-primary/40 bg-primary/10 text-primary",
  Addition: "border-secondary/50 bg-secondary/15 text-secondary",
};

function Serveurs() {
  const { servers, tables, addServer, toggleServer, addTable, cycleTableStatus } = useStore();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Plan de salle");

  const [serverOpen, setServerOpen] = useState(false);
  const [sName, setSName] = useState("");
  const [sPhone, setSPhone] = useState("");

  const [tableOpen, setTableOpen] = useState(false);
  const [tName, setTName] = useState("");
  const [tSeats, setTSeats] = useState("4");

  const submitServer = () => {
    if (!sName.trim()) {
      toast.error("Le nom du serveur est obligatoire.");
      return;
    }
    addServer({ name: sName.trim(), phone: sPhone.trim() || "—" });
    toast.success(`${sName.trim()} ajouté`);
    setSName("");
    setSPhone("");
    setServerOpen(false);
  };

  const submitTable = () => {
    const seats = parseInt(tSeats || "0", 10);
    if (!tName.trim() || seats <= 0) {
      toast.error("Nom et nombre de places sont obligatoires.");
      return;
    }
    addTable({ name: tName.trim(), seats });
    toast.success(`${tName.trim()} créée`);
    setTName("");
    setTSeats("4");
    setTableOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold text-foreground">Serveurs & tables</h1>
          <p className="text-xs text-muted-foreground">Plan de salle et équipe en poste</p>
        </div>

        <div className="flex rounded-2xl bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-xl py-2 text-sm font-semibold transition-colors",
                tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Plan de salle" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3 text-xs">
                {Object.keys(statusStyle).map((s) => (
                  <span key={s} className="flex items-center gap-1.5">
                    <span className={cn("h-3 w-3 rounded-full border", statusStyle[s])} /> {s}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setTableOpen(true)}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Table
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Touchez une table pour changer son statut</p>
            <div className="grid grid-cols-2 gap-3">
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => cycleTableStatus(t.id)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-2xl border-2 py-6 shadow-card active:scale-[0.98]",
                    statusStyle[t.status],
                  )}
                >
                  <Users className="mb-1 h-5 w-5 opacity-70" />
                  <p className="font-display text-base font-extrabold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.seats} places</p>
                  <span className="mt-1 text-[11px] font-bold">{t.status}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "Serveurs" && (
          <>
            <button
              onClick={() => setServerOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-card py-3 text-sm font-bold text-primary"
            >
              <Plus className="h-4 w-4" /> Ajouter un serveur
            </button>
            <div className="space-y-2">
              {servers.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-primary-foreground">
                      {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{s.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {s.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {s.active && (
                      <>
                        <p className="text-sm font-bold tabular-nums text-foreground">{fcfa(s.sales)}</p>
                        <p className="text-[11px] text-muted-foreground">{s.orders} commandes</p>
                      </>
                    )}
                    <button
                      onClick={() => toggleServer(s.id)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                        s.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {s.active ? "Actif" : "Inactif"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomSheet open={serverOpen} onClose={() => setServerOpen(false)} title="Nouveau serveur" subtitle="Ajouter un membre à l'équipe">
        <div className="space-y-3">
          <Field label="Nom complet">
            <input value={sName} onChange={(e) => setSName(e.target.value)} className={inputClass} placeholder="Ex. Yao Kouassi" />
          </Field>
          <Field label="Téléphone">
            <input value={sPhone} onChange={(e) => setSPhone(e.target.value)} className={inputClass} placeholder="+225 07 00 00 00" />
          </Field>
          <button
            onClick={submitServer}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
          >
            Ajouter le serveur
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={tableOpen} onClose={() => setTableOpen(false)} title="Nouvelle table" subtitle="Ajouter une table au plan de salle">
        <div className="space-y-3">
          <Field label="Nom de la table">
            <input value={tName} onChange={(e) => setTName(e.target.value)} className={inputClass} placeholder="Ex. Table 9" />
          </Field>
          <Field label="Nombre de places">
            <input inputMode="numeric" value={tSeats} onChange={(e) => setTSeats(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="4" />
          </Field>
          <button
            onClick={submitTable}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
          >
            Ajouter la table
          </button>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
