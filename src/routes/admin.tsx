import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock, ShieldCheck, LogOut, Store, Users, BarChart3,
  CheckCircle2, XCircle, ChevronRight, ChevronLeft, RefreshCw,
  Building2, Phone, Crown, UserCheck, Calendar, Hash,
  TrendingUp, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminSecret, setAdminSecret, clearAdminSecret, verifyAdminSecret,
  getAdminStats, getAdminEstablishments, getAdminEstablishmentDetail,
  deactivateEstablishment, reactivateEstablishment,
  type AdminEstablishment, type AdminUser,
} from "@/lib/admin-api";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full bg-zinc-700 font-bold text-zinc-200 ${s}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>
      {active ? <CheckCircle2 className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
      {active ? "Actif" : "Suspendu"}
    </span>
  );
}

// ── Login ─────────────────────────────────────────────────────────────────────

function AdminLogin({ onAuth }: { onAuth: () => void }) {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    try {
      const ok = await verifyAdminSecret(secret.trim());
      if (!ok) { toast.error("Clé admin incorrecte."); return; }
      setAdminSecret(secret.trim());
      onAuth();
    } catch {
      toast.error("Impossible de joindre le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Panneau Admin</h1>
          <p className="text-sm text-zinc-500">Caisse+ · Caisse+ v2.1 · JS-DEV · tout droits reservés</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
          <label className="block">
            <span className="mb-2 block text-xs font-semibold text-zinc-400">
              Clé d'accès administrateur
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3 focus-within:border-emerald-500">
              <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-zinc-600"
                autoComplete="off"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading || !secret.trim()}
            className="mt-4 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Vérification…" : "Accéder au panneau"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-600">
          Accès réservé à l'administrateur de la plateforme.
        </p>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "emerald" }: {
  icon: typeof Store; label: string; value: string | number; sub?: string;
  color?: "emerald" | "blue" | "amber" | "rose";
}) {
  const c = {
    emerald: "text-emerald-400 bg-emerald-400/10",
    blue: "text-blue-400 bg-blue-400/10",
    amber: "text-amber-400 bg-amber-400/10",
    rose: "text-rose-400 bg-rose-400/10",
  }[color];
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl ${c}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-0.5 text-2xl font-extrabold text-white tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-zinc-500">{sub}</p>}
    </div>
  );
}

// ── User card ─────────────────────────────────────────────────────────────────

function UserCard({ user, isOwner }: { user: AdminUser; isOwner?: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isOwner ? "border-emerald-500/20 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900"}`}>
      <Avatar name={user.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-400" />}
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-bold ${isOwner ? "text-emerald-400" : "text-zinc-500"}`}>
            {isOwner ? "Propriétaire" : "Gérant"}
          </span>
          {user.phone && (
            <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
              <Phone className="h-2.5 w-2.5" /> {user.phone}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[10px] font-bold ${user.active ? "text-emerald-400" : "text-rose-400"}`}>
          {user.active ? "Actif" : "Inactif"}
        </span>
        <span className="text-[10px] text-zinc-600">{fmt(user.createdAt)}</span>
      </div>
    </div>
  );
}

// ── Establishment list item ───────────────────────────────────────────────────

function EstRow({ est, selected, onSelect }: {
  est: AdminEstablishment; selected: boolean; onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99] ${
        selected
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
      }`}
    >
      {est.logoUrl ? (
        <img src={est.logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
          <Store className="h-4 w-4 text-zinc-500" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">{est.name}</p>
          <Badge active={est.active} />
        </div>
        <p className="truncate text-[11px] text-zinc-500">
          {est.proprietaireName ?? "—"} · #{est.code}
        </p>
        <p className="text-[10px] text-zinc-600">
          {est.gerantsCount} gérant{est.gerantsCount !== 1 ? "s" : ""} · {est.salesCount} ventes
        </p>
      </div>
    </button>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ id, onBack }: { id: string; onBack: () => void }) {
  const qc = useQueryClient();

  const { data: est, isLoading } = useQuery({
    queryKey: ["admin", "est", id],
    queryFn: () => getAdminEstablishmentDetail(id),
  });

  const deactivate = useMutation({
    mutationFn: () => deactivateEstablishment(id),
    onSuccess: () => { toast.success("Établissement suspendu."); void qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const reactivate = useMutation({
    mutationFn: () => reactivateEstablishment(id),
    onSuccess: () => { toast.success("Établissement réactivé."); void qc.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!est) return null;

  return (
    <div className="space-y-5 pb-8">
      {/* Back button — mobile only */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-white lg:hidden">
        <ChevronLeft className="h-4 w-4" /> Retour à la liste
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="flex items-start gap-4">
          {est.logoUrl ? (
            <img src={est.logoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
              <Building2 className="h-7 w-7 text-zinc-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-lg font-extrabold text-white leading-tight">{est.name}</h2>
              <Badge active={est.active} />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Hash className="h-3 w-3" /> {est.code}
              </span>
              <span className="text-xs text-zinc-500">{est.type}</span>
              {est.city && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="h-3 w-3" /> {est.city}
                </span>
              )}
              {est.phone && (
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <Phone className="h-3 w-3" /> {est.phone}
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-600">
              <Calendar className="h-3 w-3" /> Inscrit le {fmt(est.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ventes", value: est.salesCount, icon: TrendingUp },
          { label: "Journées", value: est.daySessionsCount, icon: Calendar },
          { label: "Dépenses", value: est.expensesCount, icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-center">
            <Icon className="mx-auto mb-1 h-4 w-4 text-zinc-500" />
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="mt-0.5 text-xl font-extrabold text-white tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Propriétaire */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          <Crown className="h-3.5 w-3.5 text-amber-400" /> Propriétaire
        </p>
        {est.proprietaire ? (
          <UserCard user={est.proprietaire} isOwner />
        ) : (
          <p className="text-sm text-zinc-600 italic">Aucun propriétaire trouvé.</p>
        )}
      </div>

      {/* Gérants */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          <UserCheck className="h-3.5 w-3.5 text-blue-400" />
          Gérants ({est.gerants.length})
        </p>
        {est.gerants.length === 0 ? (
          <p className="text-sm text-zinc-600 italic">Aucun gérant créé.</p>
        ) : (
          <div className="space-y-2">
            {est.gerants.map((g) => <UserCard key={g.id} user={g} />)}
          </div>
        )}
      </div>

      {/* Action */}
      <div className="pt-1">
        {est.active ? (
          <button
            onClick={() => {
              if (confirm(`Suspendre "${est.name}" ? Les utilisateurs ne pourront plus se connecter.`)) {
                deactivate.mutate();
              }
            }}
            disabled={deactivate.isPending}
            className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/15 disabled:opacity-50"
          >
            {deactivate.isPending ? "Suspension…" : "Suspendre cet établissement"}
          </button>
        ) : (
          <button
            onClick={() => reactivate.mutate()}
            disabled={reactivate.isPending}
            className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-400 hover:bg-emerald-500/15 disabled:opacity-50"
          >
            {reactivate.isPending ? "Réactivation…" : "Réactiver cet établissement"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyDetail() {
  return (
    <div className="hidden h-full items-center justify-center lg:flex">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900">
          <Building2 className="h-8 w-8 text-zinc-700" />
        </div>
        <p className="text-sm font-medium text-zinc-600">
          Sélectionne un établissement pour voir les détails
        </p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const qc = useQueryClient();

  const { data: stats } = useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats });
  const { data: establishments = [], isLoading, refetch } = useQuery({
    queryKey: ["admin", "establishments"],
    queryFn: getAdminEstablishments,
  });

  const filtered = establishments.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      e.name.toLowerCase().includes(q) ||
      e.code.includes(q) ||
      (e.city ?? "").toLowerCase().includes(q) ||
      (e.proprietaireName ?? "").toLowerCase().includes(q);
    const matchFilter =
      filterActive === "all" ||
      (filterActive === "active" && e.active) ||
      (filterActive === "inactive" && !e.active);
    return matchSearch && matchFilter;
  });

  // On mobile, when an item is selected show only detail
  const showDetail = !!selectedId;

  return (
    <div className="flex h-screen flex-col bg-zinc-950 overflow-hidden">
      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 backdrop-blur lg:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/20">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white leading-none">Admin · Caisse+</h1>
            <p className="text-[10px] text-zinc-500"></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { void qc.invalidateQueries({ queryKey: ["admin"] }); void refetch(); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-500 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="shrink-0 border-b border-zinc-800 px-4 py-3 lg:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Building2} label="Établissements" value={stats?.totalEstablishments ?? "—"} sub={`${stats?.activeEstablishments ?? 0} actifs`} color="emerald" />
          <StatCard icon={XCircle} label="Suspendus" value={stats?.inactiveEstablishments ?? "—"} color="rose" />
          <StatCard icon={Users} label="Utilisateurs" value={stats?.totalUsers ?? "—"} color="blue" />
          <StatCard icon={BarChart3} label="Ventes totales" value={stats?.totalSales ?? "—"} color="amber" />
        </div>
      </div>

      {/* Main two-column area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: list — hidden on mobile when detail is open */}
        <div className={`flex flex-col border-r border-zinc-800 lg:w-80 xl:w-96 ${showDetail ? "hidden lg:flex" : "flex w-full"}`}>
          {/* Search & filter */}
          <div className="shrink-0 space-y-2 border-b border-zinc-800 p-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, code, ville, propriétaire…"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-800 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />
            <div className="flex gap-1.5">
              {(["all", "active", "inactive"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterActive(f)}
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                    filterActive === f
                      ? "bg-emerald-600 text-white"
                      : "border border-zinc-800 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {f === "all" ? "Tous" : f === "active" ? "Actifs" : "Suspendus"}
                </button>
              ))}
              <span className="ml-auto text-[11px] text-zinc-600 self-center">
                {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-900" />
              ))
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-600">Aucun résultat.</p>
            ) : (
              filtered.map((est) => (
                <EstRow
                  key={est.id}
                  est={est}
                  selected={selectedId === est.id}
                  onSelect={() => setSelectedId(est.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className={`flex-1 overflow-y-auto px-4 py-5 lg:px-6 ${showDetail ? "block" : "hidden lg:block"}`}>
          {selectedId ? (
            <DetailPanel key={selectedId} id={selectedId} onBack={() => setSelectedId(null)} />
          ) : (
            <EmptyDetail />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

function AdminPanel() {
  const [authed, setAuthed] = useState(!!getAdminSecret());
  const logout = () => { clearAdminSecret(); setAuthed(false); };

  if (!authed) return <AdminLogin onAuth={() => setAuthed(true)} />;
  return <AdminDashboard onLogout={logout} />;
}
