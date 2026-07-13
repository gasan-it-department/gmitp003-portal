import JsBarcode from "jsbarcode";

/**
 * A4 sheet of EAN-13 barcode labels for Document Receiving.
 *
 * Each label is 40mm × 30mm and mirrors the reference sticker:
 *   MUNICIPALITY PROVINCE   (thin, letter-spaced)
 *   UNIT / OFFICE           (bold)
 *   [EAN-13 barcode + number]
 *
 * A4 portrait fits 5 columns × 9 rows = 45 labels/sheet. Barcodes are rendered
 * as vector SVG (JsBarcode) so they print at the printer's native resolution.
 * Each cell has a dashed border to trace when cutting.
 */

export interface BarcodeSheetOptions {
  municipality: string;
  province: string;
  unit: string;
  /** Number of A4 sheets to fill (each = 45 labels). Default 1. */
  sheets?: number;
}

const COLS = 5;
const ROWS = 9;
export const LABELS_PER_SHEET = COLS * ROWS; // 45

const esc = (s: string) =>
  (s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] as string,
  );

/** Render one EAN-13 (12 data digits → JsBarcode adds the check digit) to an
 *  SVG string sized purely by its viewBox, so CSS controls the printed size. */
function ean13Svg(value12: string): string {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  try {
    JsBarcode(svg, value12, {
      format: "EAN13",
      width: 2,
      height: 46,
      fontSize: 15,
      textMargin: 1,
      margin: 0,
      displayValue: true,
      font: "monospace",
    });
  } catch {
    return "";
  }
  const w = svg.getAttribute("width");
  const h = svg.getAttribute("height");
  if (w && h) svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return new XMLSerializer().serializeToString(svg);
}

/**
 * Open a print-ready window with `sheets` full A4 pages of barcode labels and
 * trigger the browser print dialog. Returns the number of labels generated
 * (0 if the popup was blocked). All barcodes in one call share a random 6-digit
 * batch prefix + a running 6-digit sequence, so they're unique.
 */
export function printBarcodeSheet(opts: BarcodeSheetOptions): number {
  const sheets = Math.max(1, Math.min(20, Math.floor(opts.sheets ?? 1)));
  const total = sheets * LABELS_PER_SHEET;

  const batch = String(100000 + Math.floor(Math.random() * 900000));
  const cells: string[] = [];
  for (let i = 1; i <= total; i++) {
    const value12 = batch + String(i).padStart(6, "0");
    cells.push(
      `<div class="st">` +
        `<div class="muni">${esc(opts.municipality)} ${esc(opts.province)}</div>` +
        `<div class="unit">${esc(opts.unit)}</div>` +
        `<div class="bc">${ean13Svg(value12)}</div>` +
        `</div>`,
    );
  }

  const pages: string[] = [];
  for (let p = 0; p < sheets; p++) {
    pages.push(
      `<div class="sheet">${cells
        .slice(p * LABELS_PER_SHEET, (p + 1) * LABELS_PER_SHEET)
        .join("")}</div>`,
    );
  }

  const html = `<!doctype html><html><head><meta charset="utf-8">
<title>Barcode labels — ${esc(opts.unit)}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 210mm; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet {
    width: 210mm; height: 297mm;
    padding: 13.5mm 5mm;
    display: grid;
    grid-template-columns: repeat(${COLS}, 40mm);
    grid-template-rows: repeat(${ROWS}, 30mm);
    page-break-after: always;
  }
  .sheet:last-child { page-break-after: auto; }
  .st {
    width: 40mm; height: 30mm;
    border: 0.3mm dashed #777;
    padding: 1.2mm 1.5mm;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; overflow: hidden;
  }
  .muni {
    font-family: "Times New Roman", serif;
    font-size: 5.5pt; letter-spacing: 0.4pt;
    text-transform: uppercase; color: #111; line-height: 1.1;
  }
  .unit {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8pt; font-weight: 800; letter-spacing: 0.2pt;
    text-transform: uppercase; color: #000;
    line-height: 1.05; margin: 0.6mm 0 0.8mm;
  }
  .bc { width: 34mm; }
  .bc svg { width: 100%; height: 13mm; display: block; }
  @media screen {
    body { background: #64748b; padding: 8mm 0; }
    .sheet { margin: 0 auto 8mm; box-shadow: 0 2px 12px rgba(0,0,0,.35); }
  }
</style></head>
<body>${pages.join("")}
<script>window.onload=function(){setTimeout(function(){try{window.focus();window.print();}catch(e){}},300);};</script>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return 0;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return total;
}
