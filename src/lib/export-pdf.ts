import { jsPDF } from "jspdf";

const TEAL: [number, number, number] = [42, 157, 157];
const TEAL_LIGHT: [number, number, number] = [129, 219, 219];
const CHARBON: [number, number, number] = [30, 41, 59];
const SLATE: [number, number, number] = [100, 116, 139];
const ROW_ALT: [number, number, number] = [241, 248, 248];

export interface ReportColumn {
  header: string;
  key: string;
  align?: "left" | "right";
  width?: number; // relative weight
}

export interface ReportSection {
  heading: string;
  columns: ReportColumn[];
  rows: Record<string, string>[];
}

export interface ReportMeta {
  title: string;
  establishment: string;
  period: string;
  dataType: string;
  summary?: { label: string; value: string }[];
}

const MARGIN = 14;

function buildDoc(meta: ReportMeta, sections: ReportSection[]): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;

  // Header band
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Caisse+", MARGIN, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(meta.establishment, MARGIN, 22);
  doc.setFontSize(9);
  const now = new Date().toLocaleString("fr-FR");
  doc.text(`Édité le ${now}`, pageW - MARGIN, 15, { align: "right" });
  doc.text(`Période : ${meta.period}`, pageW - MARGIN, 21, { align: "right" });
  doc.text(`Données : ${meta.dataType}`, pageW - MARGIN, 27, { align: "right" });

  let y = 44;
  doc.setTextColor(...CHARBON);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(meta.title, MARGIN, y);
  y += 8;

  // Summary cards
  if (meta.summary && meta.summary.length) {
    const cols = meta.summary.length;
    const gap = 4;
    const cardW = (contentW - gap * (cols - 1)) / cols;
    meta.summary.forEach((s, i) => {
      const x = MARGIN + i * (cardW + gap);
      doc.setFillColor(...ROW_ALT);
      doc.roundedRect(x, y, cardW, 18, 2, 2, "F");
      doc.setTextColor(...SLATE);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(s.label, x + 4, y + 6);
      doc.setTextColor(...CHARBON);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(s.value, x + 4, y + 14);
    });
    y += 26;
  }

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 16) {
      doc.addPage();
      y = 20;
    }
  };

  sections.forEach((section) => {
    ensureSpace(20);
    doc.setTextColor(...TEAL);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(section.heading, MARGIN, y);
    y += 6;

    const totalWeight = section.columns.reduce((s, c) => s + (c.width ?? 1), 0);
    const colX: number[] = [];
    const colW: number[] = [];
    let cursor = MARGIN;
    section.columns.forEach((c) => {
      const w = (contentW * (c.width ?? 1)) / totalWeight;
      colX.push(cursor);
      colW.push(w);
      cursor += w;
    });

    // Header row
    doc.setFillColor(...TEAL_LIGHT);
    doc.rect(MARGIN, y, contentW, 8, "F");
    doc.setTextColor(...CHARBON);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    section.columns.forEach((c, i) => {
      const tx = c.align === "right" ? colX[i] + colW[i] - 3 : colX[i] + 3;
      doc.text(c.header, tx, y + 5.5, { align: c.align === "right" ? "right" : "left" });
    });
    y += 8;

    doc.setFont("helvetica", "normal");
    section.rows.forEach((row, ri) => {
      ensureSpace(8);
      if (ri % 2 === 1) {
        doc.setFillColor(...ROW_ALT);
        doc.rect(MARGIN, y, contentW, 7, "F");
      }
      doc.setTextColor(...CHARBON);
      doc.setFontSize(9);
      section.columns.forEach((c, i) => {
        const val = row[c.key] ?? "";
        const tx = c.align === "right" ? colX[i] + colW[i] - 3 : colX[i] + 3;
        doc.text(String(val), tx, y + 5, { align: c.align === "right" ? "right" : "left" });
      });
      y += 7;
    });
    y += 8;
  });

  // Footer on every page
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...TEAL_LIGHT);
    doc.line(MARGIN, pageH - 12, pageW - MARGIN, pageH - 12);
    doc.setTextColor(...SLATE);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Caisse+ · Rapport généré automatiquement", MARGIN, pageH - 7);
    doc.text(`Page ${p} / ${pages}`, pageW - MARGIN, pageH - 7, { align: "right" });
  }

  return doc;
}

function fileName(meta: ReportMeta): string {
  const slug = `${meta.title}-${meta.period}-${meta.dataType}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `caisse-plus-${slug}.pdf`;
}

export function downloadReportPDF(meta: ReportMeta, sections: ReportSection[]): void {
  const doc = buildDoc(meta, sections);
  doc.save(fileName(meta));
}

export async function shareReportPDF(meta: ReportMeta, sections: ReportSection[]): Promise<"shared" | "downloaded"> {
  const doc = buildDoc(meta, sections);
  const name = fileName(meta);
  const blob = doc.output("blob");
  const file = new File([blob], name, { type: "application/pdf" });

  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (typeof navigator !== "undefined" && navigator.share && nav.canShare?.({ files: [file] })) {
    await navigator.share({
      title: meta.title,
      text: `${meta.title} · ${meta.establishment} (${meta.period})`,
      files: [file],
    });
    return "shared";
  }

  doc.save(name);
  return "downloaded";
}
