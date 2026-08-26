/**
 * Where the ink actually is inside a signature file.
 *
 * A signature image is mostly empty. Stamping it by the FILE's edges is what
 * made the mark float near the top of its box on signed PDFs while the long
 * tail ran down through the printed name. Knowing the ink's real bounds lets
 * the stamp size and place the writing instead of the padding.
 *
 * Measured here rather than on the server because the browser already
 * decoded the image to show a preview, and the server has no image decoder.
 * The value is cosmetic geometry and the server clamps it anyway.
 */

/** 0-1 fractions of the image, y measured from the TOP. */
export interface InkBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const FULL_INK: InkBox = { x0: 0, y0: 0, x1: 1, y1: 1 };

/**
 * A pixel counts as ink when it is opaque enough AND dark enough.
 *
 * Both tests are needed: cut-out signatures are transparent PNGs where alpha
 * alone is the answer, while photographed ones are opaque white paper where
 * only darkness is. A file that is entirely one or the other still works.
 */
const ALPHA_MIN = 24;
const LUMA_MAX = 230;

export const measureInk = (
  img: HTMLImageElement | HTMLCanvasElement,
): InkBox => {
  const w = (img as HTMLImageElement).naturalWidth ?? img.width;
  const h = (img as HTMLImageElement).naturalHeight ?? img.height;
  if (!w || !h) return FULL_INK;

  // Work at a bounded size: a 4000px scan buys nothing over a 600px one and
  // costs a visible pause on an office machine.
  const scale = Math.min(1, 600 / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return FULL_INK;
  ctx.drawImage(img, 0, 0, cw, ch);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, cw, ch).data;
  } catch {
    // A cross-origin image taints the canvas. Not worth failing an upload.
    return FULL_INK;
  }

  let x0 = cw, y0 = ch, x1 = -1, y1 = -1;
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y * cw + x) * 4;
      const a = data[i + 3];
      if (a < ALPHA_MIN) continue;
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // On a transparent cut-out the stroke may be any colour, so partial
      // alpha counts as ink on its own.
      if (luma > LUMA_MAX && a > 250) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0 || y1 < 0) return FULL_INK;

  // A hair of padding so an anti-aliased edge is not clipped, then back to
  // fractions of the whole file.
  const pad = 1;
  const box = {
    x0: Math.max(0, x0 - pad) / cw,
    y0: Math.max(0, y0 - pad) / ch,
    x1: Math.min(cw, x1 + 1 + pad) / cw,
    y1: Math.min(ch, y1 + 1 + pad) / ch,
  };
  if (box.x1 - box.x0 < 0.01 || box.y1 - box.y0 < 0.01) return FULL_INK;
  return box;
};

/** Same, straight from a File the user just picked. */
export const measureInkFromFile = (file: File): Promise<InkBox> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const box = measureInk(img);
      URL.revokeObjectURL(url);
      resolve(box);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(FULL_INK);
    };
    img.src = url;
  });

/**
 * Where the signature lands inside its placement box.
 *
 * Mirrors `placeSignature` in the API's src/service/signaturePlacement.ts so
 * the preview shows what the stamp will actually do. The server is the one
 * that matters — e2e_signature_placement.ts is the source of truth for this
 * arithmetic — but a preview that disagrees with it would be worse than no
 * preview at all, so the two are kept in step deliberately.
 */
export const placeSignature = (
  box: { x: number; y: number; width: number; height: number },
  imgW: number,
  imgH: number,
  settings: {
    inkHeightPt?: number | null;
    baselinePct?: number | null;
    ink?: InkBox | null;
  },
) => {
  const ratio = imgW > 0 && imgH > 0 ? imgW / imgH : 1;
  const height = Number(settings.inkHeightPt ?? 0);

  if (!(height > 0)) {
    let width = box.width;
    let h = box.width / ratio;
    if (h > box.height) {
      h = box.height;
      width = box.height * ratio;
    }
    return {
      x: box.x + (box.width - width) / 2,
      y: box.y + (box.height - h) / 2,
      width,
      height: h,
      sized: false,
    };
  }

  const ink = settings.ink ?? FULL_INK;
  const inkW = ink.x1 - ink.x0;
  const inkH = ink.y1 - ink.y0;
  const drawH = height / inkH;
  const drawW = drawH * ratio;
  const baseline = Math.min(100, Math.max(0, Number(settings.baselinePct ?? 100))) / 100;
  const lineFromTop = ink.y0 + baseline * inkH;

  return {
    // Screen coordinates: y grows DOWNWARD here, unlike the PDF, so the
    // writing line is placed by measuring down from the image's top.
    x: box.x + box.width / 2 - (ink.x0 + inkW / 2) * drawW,
    y: box.y + box.height - lineFromTop * drawH,
    width: drawW,
    height: drawH,
    sized: true,
  };
};
