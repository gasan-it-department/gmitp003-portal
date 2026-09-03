import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";

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
 * Each label is a solid, round-cornered box with a 1mm gutter around it,
 * so the sheet reads as separated stickers rather than one ruled grid.
 * The gap is also the cutting allowance — a blade following a shared
 * line has to be exact, whereas a little white either side forgives a
 * wobble.
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
/** White gutter between labels, in mm. Also the cutting allowance. */
const GAP = 1;
/** Corner radius of each label, in mm. */
const RADIUS = 1.5;
/** Sheet edge margin, in mm. Trimmed to buy back what the gutters cost. */
const MARGIN = 4;
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
      // Taller bars relative to the 95-module width: the symbol's width is
      // fixed by the standard, so height is the only way to buy back scan
      // angle on a 33.5mm label.
      height: 70,
      fontSize: 15,
      textMargin: 1,
      margin: 0,
      displayValue: true,
      font: "monospace",
    });
  } catch {
    return "";
  }
  // JsBarcode writes width/height WITH a "px" suffix, and those attributes
  // were being copied straight into the viewBox. A viewBox whose numbers
  // carry units is invalid: the browser discards it, the SVG is left with no
  // coordinate system, and the drawing is CLIPPED to the CSS box instead of
  // scaled into it. Every printed barcode was truncated to roughly 59% of
  // the symbol — unscannable — with the number cut through the middle.
  //
  // Its height attribute is short as well: it stops at the text baseline and
  // ignores the descenders. So measure the real extents rather than trust
  // either number, which means putting the node in the document for the
  // length of one getBBox call.
  let w = parseFloat(svg.getAttribute("width") ?? "0");
  let h = parseFloat(svg.getAttribute("height") ?? "0");
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  svg.setAttribute(
    "style",
    "position:absolute;left:-9999px;top:0;visibility:hidden",
  );
  document.body.appendChild(svg);
  try {
    const b = svg.getBBox();
    if (b.width > 0 && b.height > 0) {
      w = Math.ceil(b.x + b.width);
      h = Math.ceil(b.y + b.height);
    }
  } catch {
    // Keep the parsed attributes; they are at least unit-free now.
  }
  svg.remove();
  svg.removeAttribute("style");

  if (w > 0 && h > 0) svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
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
    padding: ${MARGIN}mm;
    display: grid;
    grid-template-columns: repeat(${COLS}, 1fr);
    grid-template-rows: repeat(${ROWS}, 1fr);
    gap: ${GAP}mm;
    page-break-after: always;
  }
  .sheet:last-child { page-break-after: auto; }
  .st {
    width: 100%; height: 100%;
    border: 0.25mm solid #444;
    border-radius: ${RADIUS}mm;
    padding: 1mm 1.5mm;
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
    line-height: 1.05; margin: 0.6mm 0 0.9mm;
  }
  .bc { width: 33.5mm; }
  /* Height follows the symbol's own aspect ratio. Pinning it to a fixed
     millimetre value letterboxes a correct viewBox and cropped a broken
     one — either way the printed bars stop matching the drawing. */
  .bc svg { width: 100%; height: auto; display: block; }
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

// ── EAN-13 encoding (draw bars directly into the PDF as vector rects) ──────
const EAN_L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"]; // prettier-ignore
const EAN_G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"]; // prettier-ignore
const EAN_R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"]; // prettier-ignore
const EAN_PARITY = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"]; // prettier-ignore

function ean13Check(d12: string): number {
  let s = 0;
  for (let i = 0; i < 12; i++) s += +d12[i] * (i % 2 === 0 ? 1 : 3);
  return (10 - (s % 10)) % 10;
}

/** 12 data digits → full 13-digit value + its 95-module binary pattern. */
function ean13(d12: string): { value: string; bits: string } {
  const value = d12 + ean13Check(d12);
  const parity = EAN_PARITY[+value[0]];
  let bits = "101";
  for (let i = 1; i <= 6; i++)
    bits += parity[i - 1] === "L" ? EAN_L[+value[i]] : EAN_G[+value[i]];
  bits += "01010";
  for (let i = 7; i <= 12; i++) bits += EAN_R[+value[i]];
  bits += "101";
  return { value, bits };
}

/**
 * Build and DOWNLOAD a real A4 PDF of barcode labels — paper size is A4
 * inside the file, so it can't be overridden by the printer's default page
 * size. Barcodes are drawn as vector rectangles (sharpest possible) and the
 * text is native PDF text. Returns the number of labels generated.
 */
export function downloadBarcodePdf(opts: BarcodeSheetOptions): number {
  const sheets = Math.max(1, Math.min(20, Math.floor(opts.sheets ?? 1)));
  const total = sheets * LABELS_PER_SHEET;

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  // Labels fill the A4 apart from a small edge margin and a GAP gutter
  // between them, so what comes out is a field of separate boxes rather
  // than one ruled grid.
  const CW = (210 - 2 * MARGIN - GAP * (COLS - 1)) / COLS; // ~39.6mm
  const CH = (297 - 2 * MARGIN - GAP * (ROWS - 1)) / ROWS; // ~31.2mm
  // 33.5mm rather than the old 35mm, to protect the quiet zone: EAN-13 wants
  // 11 clear modules to the left of the symbol and 7 to the right, which here
  // is 3.9mm and 2.5mm. At 33.5mm the label leaves 3.05mm each side — better
  // than the 2.5mm this sheet printed before any of these changes — and the
  // module stays at 0.353mm, well above the 0.264mm floor.
  const BC_W = 33.5; // barcode width mm (95 modules)
  const MOD = BC_W / 95;

  const muniText = `${opts.municipality} ${opts.province}`.toUpperCase();
  const batch = String(100000 + Math.floor(Math.random() * 900000));

  for (let i = 0; i < total; i++) {
    const posInSheet = i % LABELS_PER_SHEET;
    if (i > 0 && posInSheet === 0) doc.addPage();
    const col = posInSheet % COLS;
    const row = Math.floor(posInSheet / COLS);
    const x0 = MARGIN + col * (CW + GAP);
    const y0 = MARGIN + row * (CH + GAP);
    const cx = x0 + CW / 2;

    // Solid cut border. Each box stands on its own with white around it,
    // so there is no shared edge for a dashed line to trace.
    doc.setDrawColor(68, 68, 68);
    doc.setLineWidth(0.25);
    doc.roundedRect(x0, y0, CW, CH, RADIUS, RADIUS, "S");

    // header text
    doc.setTextColor(20, 20, 20);
    doc.setFont("times", "normal");
    doc.setFontSize(6);
    doc.setCharSpace(0.3);
    doc.text(muniText, cx, y0 + 4, { align: "center" });
    doc.setCharSpace(0);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const unitLines = doc
      .splitTextToSize((opts.unit || "").toUpperCase(), CW - 4)
      .slice(0, 2);
    unitLines.forEach((ln: string, n: number) =>
      doc.text(ln, cx, y0 + 7.6 + n * 3.3, { align: "center" }),
    );

    // barcode bars (merge runs of "1" into single rects). Bar height fills the
    // space left under the header — taller when the unit is one line.
    const { value, bits } = ean13(batch + String(i + 1).padStart(6, "0"));
    const headerBottom = 7.6 + unitLines.length * 3.3 + 1.4; // from y0
    const barTop = y0 + headerBottom;
    const BC_H = Math.min(16, CH - headerBottom - 4); // 4mm: number + bottom pad
    const barX = x0 + (CW - BC_W) / 2;
    doc.setFillColor(0, 0, 0);
    let m = 0;
    while (m < 95) {
      if (bits[m] === "1") {
        let j = m;
        while (j < 95 && bits[j] === "1") j++;
        doc.rect(barX + m * MOD, barTop, (j - m) * MOD, BC_H, "F");
        m = j;
      } else m++;
    }
    // human-readable number
    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);
    doc.text(value, cx, barTop + BC_H + 2.9, { align: "center" });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const safeUnit = (opts.unit || "labels")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  doc.save(`barcodes-${safeUnit}-${stamp}.pdf`);
  return total;
}
