import { createFileRoute } from "@tanstack/react-router";
import { Copy, Download, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/qr-menu")({
  component: QrMenu,
});

function QrMenu() {
  const { establishment } = useStore();
  const est = establishment ?? { name: "Caisse+", code: "0000" };
  const menuUrl = `https://caisse.plus/m/${est.code}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&color=0F9D6A&data=${encodeURIComponent(menuUrl)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      toast.success("Lien du menu copié");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Menu ${est.name}`, url: menuUrl });
      } catch {
        /* annulé */
      }
    } else {
      copy();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold text-foreground">QR Code menu</h1>
          <p className="text-xs text-muted-foreground">Vos clients scannent et commandent à table</p>
        </div>

        <div className="flex flex-col items-center rounded-3xl border border-border bg-card p-6 shadow-card">
          <div className="rounded-2xl bg-background p-4">
            <img src={qrSrc} alt={`QR code du menu de ${est.name}`} width={240} height={240} className="h-60 w-60" />
          </div>
          <p className="mt-4 font-display text-lg font-extrabold text-foreground">{est.name}</p>
          <p className="text-xs text-muted-foreground">Carte digitale · Code {est.code}</p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
          <div className="flex items-center gap-2 overflow-hidden">
            <QrCode className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate text-sm text-muted-foreground">{menuUrl}</span>
          </div>
          <button onClick={copy} className="shrink-0 text-primary">
            <Copy className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={qrSrc}
            download={`qr-menu-${est.code}.png`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-bold text-foreground shadow-card active:scale-[0.99]"
          >
            <Download className="h-5 w-5 text-primary" /> Télécharger
          </a>
          <button
            onClick={share}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-elevated active:scale-[0.99]"
          >
            <Share2 className="h-5 w-5" /> Partager
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
