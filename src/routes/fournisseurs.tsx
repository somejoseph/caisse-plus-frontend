import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Phone, User2, Tag, Truck, StickyNote, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { getSuppliersApi, createSupplierApi, updateSupplierApi, deleteSupplierApi } from "@/lib/graphql/operations";
import type { Supplier } from "@/lib/mock-data";

export const Route = createFileRoute("/fournisseurs")({
  component: Fournisseurs,
});

function Fournisseurs() {
  const qc = useQueryClient();

  const { data: suppliers = [] } = useQuery({ queryKey: ["suppliers"], queryFn: getSuppliersApi });

  const createMut = useMutation({
    mutationFn: createSupplierApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateSupplierApi>[1] }) =>
      updateSupplierApi(id, input),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteSupplierApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  // Create form
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  // Edit form
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [eName, setEName] = useState("");
  const [eContact, setEContact] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eCategory, setECategory] = useState("");
  const [eNote, setENote] = useState("");

  const resetCreate = () => { setName(""); setContact(""); setPhone(""); setCategory(""); setNote(""); };

  const submit = async () => {
    if (!name.trim()) { toast.error("Le nom du fournisseur est obligatoire."); return; }
    try {
      await createMut.mutateAsync({
        name: name.trim(),
        contact: contact.trim() || undefined,
        phone: phone.trim() || undefined,
        category: category.trim() || "Divers",
        note: note.trim() || undefined,
      });
      toast.success(`${name.trim()} ajouté`);
      resetCreate();
      setOpen(false);
    } catch { toast.error("Impossible d'enregistrer le fournisseur."); }
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setEName(s.name);
    setEContact(s.contact ?? "");
    setEPhone(s.phone ?? "");
    setECategory(s.category ?? "");
    setENote(s.note ?? "");
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editing || !eName.trim()) { toast.error("Le nom du fournisseur est obligatoire."); return; }
    try {
      await updateMut.mutateAsync({
        id: editing.id,
        input: {
          name: eName.trim(),
          contact: eContact.trim() || undefined,
          phone: ePhone.trim() || undefined,
          category: eCategory.trim() || undefined,
          note: eNote.trim() || undefined,
        },
      });
      toast.success(`${eName.trim()} mis à jour`);
      setEditOpen(false);
    } catch { toast.error("Impossible de modifier le fournisseur."); }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`Supprimer le fournisseur "${s.name}" ?`)) return;
    try {
      await deleteMut.mutateAsync(s.id);
      toast.success(`${s.name} supprimé`);
    } catch { toast.error("Impossible de supprimer ce fournisseur."); }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Fournisseurs</h1>
            <p className="text-xs text-muted-foreground">{suppliers.length} fournisseur(s) enregistré(s)</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>

        <Link
          to="/approvisionnement"
          className="flex items-center gap-3 rounded-2xl bg-brand-gradient p-4 text-primary-foreground shadow-card active:scale-[0.99]"
        >
          <Truck className="h-7 w-7" />
          <div>
            <p className="text-sm font-semibold">Réceptionner une livraison</p>
            <p className="text-xs text-primary-foreground/80">Associez un fournisseur à chaque réception</p>
          </div>
        </Link>

        <button
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-card py-3 text-sm font-bold text-primary"
        >
          <Plus className="h-4 w-4" /> Nouveau fournisseur
        </button>

        <div className="space-y-2">
          {suppliers.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">{s.name}</p>
                <span className="flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 text-[11px] font-bold text-foreground">
                  <Tag className="h-3 w-3 text-primary" /> {s.category || "Divers"}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {s.contact && <p className="flex items-center gap-2"><User2 className="h-3.5 w-3.5 text-primary" /> {s.contact}</p>}
                {s.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> {s.phone}</p>}
                {s.note && <p className="flex items-center gap-2"><StickyNote className="h-3.5 w-3.5 text-primary" /> {s.note}</p>}
              </div>
              <div className="mt-2 flex gap-2 border-t border-border pt-2">
                <button
                  onClick={() => openEdit(s)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted py-2 text-xs font-bold text-foreground active:scale-[0.98]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </button>
                <button
                  onClick={() => void handleDelete(s)}
                  disabled={deleteMut.isPending}
                  className="flex items-center justify-center gap-1 rounded-xl bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive active:scale-[0.98] disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </button>
              </div>
            </div>
          ))}
          {suppliers.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun fournisseur enregistré.</p>
          )}
        </div>
      </div>

      {/* Create sheet */}
      <BottomSheet open={open} onClose={() => setOpen(false)} title="Nouveau fournisseur" subtitle="Ajouter un partenaire d'approvisionnement">
        <div className="space-y-3">
          <Field label="Nom du fournisseur">
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Ex. Brasserie Solibra" />
          </Field>
          <Field label="Personne de contact">
            <input value={contact} onChange={(e) => setContact(e.target.value)} className={inputClass} placeholder="Ex. Kouadio Yves" />
          </Field>
          <Field label="Téléphone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+225 27 21 00 11" />
          </Field>
          <Field label="Catégorie de produits">
            <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} placeholder="Ex. Bières, Spiritueux…" />
          </Field>
          <Field label="Note (optionnel)">
            <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="Ex. Livraison mardi & vendredi" />
          </Field>
          <button
            onClick={submit}
            disabled={createMut.isPending}
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
          >
            {createMut.isPending ? "Enregistrement…" : "Enregistrer le fournisseur"}
          </button>
        </div>
      </BottomSheet>

      {/* Edit sheet */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Modifier le fournisseur" subtitle={editing?.name ?? ""}>
        <div className="space-y-3">
          <Field label="Nom du fournisseur">
            <input value={eName} onChange={(e) => setEName(e.target.value)} className={inputClass} placeholder="Ex. Brasserie Solibra" />
          </Field>
          <Field label="Personne de contact">
            <input value={eContact} onChange={(e) => setEContact(e.target.value)} className={inputClass} placeholder="Ex. Kouadio Yves" />
          </Field>
          <Field label="Téléphone">
            <input value={ePhone} onChange={(e) => setEPhone(e.target.value)} className={inputClass} placeholder="+225 27 21 00 11" />
          </Field>
          <Field label="Catégorie de produits">
            <input value={eCategory} onChange={(e) => setECategory(e.target.value)} className={inputClass} placeholder="Ex. Bières, Spiritueux…" />
          </Field>
          <Field label="Note (optionnel)">
            <input value={eNote} onChange={(e) => setENote(e.target.value)} className={inputClass} placeholder="Ex. Livraison mardi & vendredi" />
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
