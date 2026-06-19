import { useState } from "react";
import { toast } from "sonner";
import { BottomSheet, Field, inputClass } from "@/components/BottomSheet";
import { CATEGORIES, type Category } from "@/lib/mock-data";
import { useStore } from "@/lib/store";

const EMOJIS = ["🍺", "🍾", "🍷", "🥤", "💧", "🥃", "🍶", "🧃"];

export function AddDrinkSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addDrink } = useStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Bières");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [threshold, setThreshold] = useState("");
  const [emoji, setEmoji] = useState("🍺");

  const reset = () => {
    setName("");
    setSize("");
    setPrice("");
    setCost("");
    setStock("");
    setThreshold("");
    setEmoji("🍺");
    setCategory("Bières");
  };

  const submit = () => {
    if (!name.trim() || !price) {
      toast.error("Nom et prix de vente sont obligatoires.");
      return;
    }
    addDrink({
      name: name.trim(),
      category,
      size: size.trim() || "—",
      price: parseInt(price || "0", 10),
      cost: parseInt(cost || "0", 10),
      stock: parseInt(stock || "0", 10),
      threshold: parseInt(threshold || "0", 10),
      emoji,
    });
    toast.success(`${name.trim()} ajoutée au catalogue`);
    reset();
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Nouvelle boisson" subtitle="Ajouter une référence au catalogue">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border text-xl ${
                emoji === e ? "border-primary bg-primary/10" : "border-border bg-card"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
        <Field label="Nom">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Ex. Flag" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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
          className="mt-2 w-full rounded-2xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
        >
          Ajouter la boisson
        </button>
      </div>
    </BottomSheet>
  );
}
