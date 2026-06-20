import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Phone, User2, Tag, Truck, StickyNote } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/fournisseurs")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — Caisse+" },
      { name: "description", content: "Gérez vos fournisseurs de boissons et associez-les à vos réceptions de stock." },
    ],
  }),
  component: Fournisseurs,
});

function Fournisseurs() {
  const { suppliers, addSupplier } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const submit = () => {
    if (!name.trim()) {
      toast.error("Le nom du fournisseur est obligatoire.");
      return;
    }
    addSupplier({
      name: name.trim(),
      contact: contact.trim() || "—",
      phone: phone.trim() || "—",
      category: category.trim() || "Divers",
      note: note.trim() || undefined,
    });
    toast.success(`${name.trim()} ajouté`);
    setName("");
    setContact("");
    setPhone("");
    setCategory("");
    setNote("");
    setOpen(false);
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
                  <Tag className="h-3 w-3 text-primary" /> {s.category}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <User2 className="h-3.5 w-3.5 text-primary" /> {s.contact}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-primary" /> {s.phone}
                </p>
                {s.note && (
                  <p className="flex items-center gap-2">
                    <StickyNote className="h-3.5 w-3.5 text-primary" /> {s.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

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
            className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
          >
            Enregistrer le fournisseur
          </button>
        </div>
      </BottomSheet>
    </AppLayout>
  );
}
