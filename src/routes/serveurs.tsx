import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone, Plus, Users, Pencil, Calendar, BadgeCheck, Lock, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { cn } from "@/lib/utils";
import { fcfa, type ServerRole } from "@/lib/mock-data";
import {
  getServersApi, getTablesApi, getUsersApi, createServerApi, updateServerApi,
  createTableApi, updateTableStatusApi, deleteTableApi, createGerantApi, updateUserApi,
  deactivateUserApi, reactivateUserApi,
  type GerantUser,
} from "@/lib/graphql/operations";
import { SERVER_ROLE_KEY } from "@/lib/graphql/adapters";
import { useStore } from "@/lib/store";
import type { ServerItem, TableStatus } from "@/lib/store";

export const Route = createFileRoute("/serveurs")({
  component: Serveurs,
});

const BASE_TABS = ["Plan de salle", "Serveurs"] as const;
const roles: ServerRole[] = ["Serveur(e)", "Gérant(e)"];

const statusStyle: Record<string, string> = {
  Libre: "border-success/40 bg-success/10 text-success",
  Occupée: "border-primary/40 bg-primary/10 text-primary",
  Addition: "border-secondary/50 bg-secondary/15 text-secondary",
};

const STATUS_CYCLE: Record<TableStatus, TableStatus> = {
  Libre: "Occupée",
  Occupée: "Addition",
  Addition: "Libre",
};

function fmtDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function Serveurs() {
  const qc = useQueryClient();
  const { currentRole } = useStore();
  const isOwner = currentRole === "Propriétaire";
  const tabs = isOwner ? [...BASE_TABS, "Gérants"] : BASE_TABS;
  const [tab, setTab] = useState<string>("Plan de salle");

  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: getServersApi });
  const { data: tables = [] } = useQuery({ queryKey: ["tables"], queryFn: getTablesApi });
  const { data: gerants = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsersApi,
    enabled: isOwner,
  });

  const createServerMut = useMutation({
    mutationFn: createServerApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["servers"] }),
  });
  const updateServerMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateServerApi>[1] }) =>
      updateServerApi(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["servers"] }),
  });
  const createTableMut = useMutation({
    mutationFn: createTableApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tables"] }),
  });
  const updateTableStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) => updateTableStatusApi(id, status),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tables"] }),
  });
  const deleteTableMut = useMutation({
    mutationFn: deleteTableApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["tables"] }),
  });
  const createGerantMut = useMutation({
    mutationFn: createGerantApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["users"] }),
  });
  const deactivateGerantMut = useMutation({
    mutationFn: deactivateUserApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["users"] }),
  });
  const reactivateGerantMut = useMutation({
    mutationFn: reactivateUserApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["users"] }),
  });
  const removeGerantMut = useMutation({
    mutationFn: deactivateUserApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["users"] }),
  });
  const updateGerantMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateUserApi>[1] }) =>
      updateUserApi(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["users"] }),
  });

  // Gérant create form
  const [gerantOpen, setGerantOpen] = useState(false);
  const [gName, setGName] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [gPin, setGPin] = useState("");

  // Gérant edit form
  const [editGerantOpen, setEditGerantOpen] = useState(false);
  const [editingGerant, setEditingGerant] = useState<GerantUser | null>(null);
  const [egName, setEgName] = useState("");
  const [egPhone, setEgPhone] = useState("");
  const [egPin, setEgPin] = useState("");

  // Server form
  const [serverOpen, setServerOpen] = useState(false);
  const [editing, setEditing] = useState<ServerItem | null>(null);
  const [sName, setSName] = useState("");
  const [sPhone, setSPhone] = useState("");
  const [sRole, setSRole] = useState<ServerRole>("Serveur(e)");
  const [sDate, setSDate] = useState(new Date().toISOString().slice(0, 10));

  // Table form
  const [tableOpen, setTableOpen] = useState(false);
  const [tName, setTName] = useState("");
  const [tSeats, setTSeats] = useState("4");

  const openAdd = () => {
    setEditing(null); setSName(""); setSPhone(""); setSRole("Serveur(e)"); setSDate(new Date().toISOString().slice(0, 10)); setServerOpen(true);
  };
  const openEdit = (s: ServerItem) => {
    setEditing(s); setSName(s.name); setSPhone(s.phone === "—" ? "" : s.phone); setSRole(s.role); setSDate(s.startDate || new Date().toISOString().slice(0, 10)); setServerOpen(true);
  };

  const submitServer = async () => {
    if (!sName.trim()) { toast.error("Le nom du serveur est obligatoire."); return; }
    try {
      const input = { name: sName.trim(), phone: sPhone.trim() || undefined, role: SERVER_ROLE_KEY[sRole], startDate: sDate };
      if (editing) {
        await updateServerMut.mutateAsync({ id: editing.id, input });
        toast.success(`${sName.trim()} mis à jour`);
      } else {
        await createServerMut.mutateAsync(input);
        toast.success(`${sName.trim()} ajouté`);
      }
      setServerOpen(false);
    } catch { toast.error("Impossible d'enregistrer le serveur."); }
  };

  const submitTable = async () => {
    const seats = parseInt(tSeats || "0", 10);
    if (!tName.trim() || seats <= 0) { toast.error("Nom et nombre de places sont obligatoires."); return; }
    try {
      await createTableMut.mutateAsync({ name: tName.trim(), seats });
      toast.success(`${tName.trim()} créée`);
      setTName(""); setTSeats("4"); setTableOpen(false);
    } catch { toast.error("Impossible de créer la table."); }
  };

  const submitGerant = async () => {
    if (!gName.trim() || !gPhone.trim() || gPin.length < 4) { toast.error("Nom, téléphone et mot de passe (4 chiffres min.) obligatoires."); return; }
    try {
      await createGerantMut.mutateAsync({ name: gName.trim(), phone: gPhone.trim(), pin: gPin });
      toast.success(`Accès créé pour ${gName.trim()}`);
      setGName(""); setGPhone(""); setGPin(""); setGerantOpen(false);
    } catch { toast.error("Impossible de créer l'accès gérant."); }
  };

  const openEditGerant = (g: GerantUser) => {
    setEditingGerant(g);
    setEgName(g.name);
    setEgPhone(g.phone ?? "");
    setEgPin("");
    setEditGerantOpen(true);
  };

  const submitEditGerant = async () => {
    if (!editingGerant) return;
    if (!egName.trim() || !egPhone.trim()) { toast.error("Nom et téléphone obligatoires."); return; }
    if (egPin && egPin.length < 4) { toast.error("Le nouveau mot de passe doit contenir au moins 4 chiffres."); return; }
    try {
      const input: Parameters<typeof updateUserApi>[1] = {
        name: egName.trim(),
        phone: egPhone.trim(),
        ...(egPin ? { pin: egPin } : {}),
      };
      await updateGerantMut.mutateAsync({ id: editingGerant.id, input });
      toast.success(`${egName.trim()} mis à jour`);
      setEditGerantOpen(false);
    } catch { toast.error("Impossible de modifier le gérant."); }
  };

  const cycleTable = (id: string, current: TableStatus) => {
    void updateTableStatusMut.mutateAsync({ id, status: STATUS_CYCLE[current] });
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
              className={cn("flex-1 rounded-xl py-2 text-xs font-semibold transition-colors", tab === t ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}
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
                <div key={t.id} className="relative">
                  <button
                    onClick={() => cycleTable(t.id, t.status)}
                    className={cn("flex w-full flex-col items-center justify-center rounded-2xl border-2 py-6 shadow-card active:scale-[0.98]", statusStyle[t.status])}
                  >
                    <Users className="mb-1 h-5 w-5 opacity-70" />
                    <p className="font-display text-base font-extrabold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.seats} places</p>
                    <span className="mt-1 text-[11px] font-bold">{t.status}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(`Supprimer "${t.name}" ?`)) return;
                      void deleteTableMut.mutateAsync(t.id).then(() =>
                        toast.success(`${t.name} supprimée`)
                      ).catch(() => toast.error("Impossible de supprimer cette table."));
                    }}
                    disabled={deleteTableMut.isPending}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-destructive/80 text-white shadow-sm active:scale-95 disabled:opacity-50"
                    aria-label="Supprimer la table"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {tables.length === 0 && (
                <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">Aucune table configurée.</p>
              )}
            </div>
          </>
        )}

        {tab === "Gérants" && isOwner && (
          <>
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
              <ShieldCheck className="mb-1 h-4 w-4 text-primary" />
              Les gérants se connectent avec le code établissement <span className="font-bold text-foreground">et leur mot de passe</span>. Ils n'ont pas accès aux marges ni aux rapports financiers complets.
            </div>
            <button
              onClick={() => { setGName(""); setGPhone(""); setGPin(""); setGerantOpen(true); }}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-card py-3 text-sm font-bold text-primary"
            >
              <Plus className="h-4 w-4" /> Ajouter un gérant
            </button>
            <div className="space-y-2">
              {gerants.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">Aucun gérant pour l'instant.</p>
              )}
              {gerants.filter((g: GerantUser) => g.role === "Gérant").map((g: GerantUser) => (
                <div key={g.id} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-primary-foreground">
                        {g.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{g.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" /> {g.phone || "—"}
                        </p>
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", g.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                      {g.active ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEditGerant(g)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted py-2 text-xs font-bold text-foreground active:scale-[0.98]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </button>
                    <button
                      onClick={() => {
                        const mut = g.active ? deactivateGerantMut : reactivateGerantMut;
                        void mut.mutateAsync(g.id).then(() =>
                          toast.success(`${g.name} ${g.active ? "désactivé" : "activé"}`)
                        );
                      }}
                      className={cn("flex-1 rounded-xl py-2 text-xs font-bold transition-colors active:scale-[0.98]", g.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}
                    >
                      {g.active ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      onClick={() => {
                        void removeGerantMut.mutateAsync(g.id).then(() => toast.success(`Accès de ${g.name} supprimé`));
                      }}
                      className="flex items-center justify-center gap-1 rounded-xl bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive active:scale-[0.98]"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "Serveurs" && (
          <>
            <button
              onClick={openAdd}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-card py-3 text-sm font-bold text-primary"
            >
              <Plus className="h-4 w-4" /> Ajouter un serveur
            </button>
            <div className="space-y-2">
              {servers.map((s: ServerItem) => (
                <div key={s.id} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-primary-foreground">
                        {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{s.name}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <BadgeCheck className="h-3 w-3 text-primary" /> {s.role}
                        </p>
                      </div>
                    </div>
                    {s.active && (
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums text-foreground">{fcfa(s.sales)}</p>
                        <p className="text-[11px] text-muted-foreground">{s.orders} commandes</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {s.phone || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Depuis {fmtDate(s.startDate)}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted py-2 text-xs font-bold text-foreground active:scale-[0.98]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Modifier
                    </button>
                    <button
                      onClick={() => {
                        void updateServerMut.mutateAsync({ id: s.id, input: { active: !s.active } }).then(() =>
                          toast.success(`${s.name} ${s.active ? "désactivé" : "activé"}`)
                        );
                      }}
                      className={cn("flex-1 rounded-xl py-2 text-xs font-bold transition-colors active:scale-[0.98]", s.active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}
                    >
                      {s.active ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomSheet open={serverOpen} onClose={() => setServerOpen(false)} title={editing ? "Modifier le serveur" : "Nouveau serveur"} subtitle={editing ? "Mettre à jour les informations" : "Ajouter un membre à l'équipe"}>
        <div className="space-y-3">
          <Field label="Nom complet">
            <input value={sName} onChange={(e) => setSName(e.target.value)} className={inputClass} placeholder="Ex. Yao Kouassi" />
          </Field>
          <Field label="Rôle">
            <div className="flex gap-2">
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSRole(r)}
                  className={cn("flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors", sRole === r ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground")}
                >
                  {r}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Téléphone">
            <input value={sPhone} onChange={(e) => setSPhone(e.target.value)} className={inputClass} placeholder="+225 07 00 00 00" />
          </Field>
          <Field label="Date de début">
            <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} className={inputClass} />
          </Field>
          <button
            onClick={submitServer}
            disabled={createServerMut.isPending || updateServerMut.isPending}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
          >
            {editing ? "Enregistrer les modifications" : "Ajouter le serveur"}
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
            disabled={createTableMut.isPending}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
          >
            Ajouter la table
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={editGerantOpen} onClose={() => setEditGerantOpen(false)} title="Modifier le gérant" subtitle={`Modifier les informations de ${editingGerant?.name ?? ""}`}>
        <div className="space-y-3">
          <Field label="Nom complet">
            <input value={egName} onChange={(e) => setEgName(e.target.value)} className={inputClass} placeholder="Ex. Kouamé Yao" />
          </Field>
          <Field label="Téléphone">
            <input value={egPhone} onChange={(e) => setEgPhone(e.target.value)} inputMode="tel" className={inputClass} placeholder="+225 07 00 00 00" />
          </Field>
          <Field label="Nouveau mot de passe (laisser vide pour ne pas changer)">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                value={egPin}
                onChange={(e) => setEgPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                type="password"
                placeholder="Laisser vide pour ne pas modifier"
                className="w-full bg-transparent py-2.5 text-sm tracking-[0.4em] outline-none"
              />
            </div>
          </Field>
          <button
            onClick={submitEditGerant}
            disabled={updateGerantMut.isPending}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
          >
            Enregistrer les modifications
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={gerantOpen} onClose={() => setGerantOpen(false)} title="Nouveau gérant" subtitle="Crée un accès gérant avec un mot de passe">
        <div className="space-y-3">
          <Field label="Nom complet">
            <input value={gName} onChange={(e) => setGName(e.target.value)} className={inputClass} placeholder="Ex. Kouamé Yao" />
          </Field>
          <Field label="Téléphone">
            <input value={gPhone} onChange={(e) => setGPhone(e.target.value)} inputMode="tel" className={inputClass} placeholder="+225 07 00 00 00" />
          </Field>
          <Field label="Mot de passe (4 à 8 chiffres)">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <input
                value={gPin}
                onChange={(e) => setGPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                inputMode="numeric"
                type="password"
                placeholder="••••"
                className="w-full bg-transparent py-2.5 text-sm tracking-[0.4em] outline-none"
              />
            </div>
          </Field>
          <p className="text-[11px] text-muted-foreground">
            Ce gérant se connectera avec le code établissement et ce mot de passe. Il aura accès aux ventes, stock et opérations — pas aux marges ni aux rapports financiers.
          </p>
          <button
            onClick={submitGerant}
            disabled={createGerantMut.isPending}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
          >
            Créer l'accès gérant
          </button>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
