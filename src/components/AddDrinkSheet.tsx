import { useState, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Camera, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { CATEGORIES, type Category } from "@/lib/mock-data";
import { createDrinkApi } from "@/lib/graphql/operations";
import { CATEGORY_KEY } from "@/lib/graphql/adapters";
import { uploadImage } from "@/lib/upload";

export function AddDrinkSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const createMut = useMutation({
    mutationFn: createDrinkApi,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["drinks"] }),
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Bières");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearPhoto = () => { setPhotoPreview(""); setPhotoFile(null); };

  const reset = () => {
    setName(""); setSize(""); setPrice(""); setCost(""); setStock(""); setThreshold("");
    clearPhoto(); setCategory("Bières");
  };

  const submit = async () => {
    if (!name.trim() || !price) {
      toast.error("Nom et prix de vente sont obligatoires.");
      return;
    }

    let imageData: string | undefined;
    if (photoFile) {
      setUploading(true);
      try {
        imageData = await uploadImage(photoFile, "drinks");
      } catch {
        toast.error("Impossible d'uploader la photo — boisson ajoutée sans image.");
      } finally {
        setUploading(false);
      }
    }

    try {
      await createMut.mutateAsync({
        name: name.trim(),
        category: CATEGORY_KEY[category] ?? category,
        size: size.trim() || "—",
        price: parseInt(price || "0", 10),
        cost: parseInt(cost || "0", 10) || undefined,
        stock: parseInt(stock || "0", 10) || undefined,
        threshold: parseInt(threshold || "0", 10) || undefined,
        imageData,
      });
      toast.success(`${name.trim()} ajoutée au catalogue`);
      reset();
      onClose();
    } catch {
      toast.error("Impossible d'ajouter la boisson.");
    }
  };

  const busy = uploading || createMut.isPending;

  return (
    <BottomSheet open={open} onClose={onClose} title="Nouvelle boisson" subtitle="Ajouter une référence au catalogue">
      <div className="space-y-3">
        <div className="flex flex-col items-center gap-3 py-1">
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Aperçu" className="h-24 w-24 rounded-2xl object-cover shadow-card" />
              <button
                type="button"
                onClick={clearPhoto}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white shadow-elevated"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/50">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-card active:scale-95"
            >
              <Camera className="h-3.5 w-3.5" /> Appareil photo
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-card active:scale-95"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Galerie
            </button>
          </div>
        </div>

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <Field label="Nom de la boisson">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Ex. Flag" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputClass}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Contenance">
            <input value={size} onChange={(e) => setSize(e.target.value)} className={inputClass} placeholder="65 cl" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prix de vente (F)">
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="1000" />
          </Field>
          <Field label="Coût d'achat (F)">
            <input inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="650" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock initial">
            <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="0" />
          </Field>
          <Field label="Seuil d'alerte">
            <input inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value.replace(/\D/g, ""))} className={inputClass} placeholder="24" />
          </Field>
        </div>
        <button
          onClick={submit}
          disabled={busy}
          className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99] disabled:opacity-60"
        >
          {uploading ? "Upload photo…" : createMut.isPending ? "Ajout en cours…" : "Ajouter la boisson"}
        </button>
      </div>
    </BottomSheet>
  );
}
