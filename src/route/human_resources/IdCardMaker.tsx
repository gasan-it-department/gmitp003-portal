import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IdCard,
  Upload,
  Save,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageOff,
  Image as ImageIcon,
  QrCode,
  ArrowRight,
  Check,
  Lock,
  Grid3x3,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

type Field =
  | "fullName"
  | "position"
  | "office"
  | "address"
  | "birthday"
  | "phone"
  | "age"
  | "civilStatus"
  | "sex"
  | "bloodType"
  | "qr"
  | "photo";
type Side = "front" | "rear";
interface Placeholder {
  id: string;
  field: Field;
  xPct: number;
  yPct: number;
  fontSize: number;
  color: string;
  bold: boolean;
  align: "left" | "center" | "right";
  size?: number; // QR/photo width in px (editor scale)
  height?: number; // photo height in px (editor scale)
  strokeWidth?: number; // text outline width in px (editor scale), 0 = none
  strokeColor?: string; // text outline color
  fontFamily?: string; // font key: "sans" | "serif" | "mono"
}
interface SideData {
  image: string | null;
  placeholders: Placeholder[];
}

const FIELD_LABEL: Record<Field, string> = {
  fullName: "Full Name",
  position: "Position",
  office: "Office/Unit",
  address: "Address",
  birthday: "Birthday",
  phone: "Phone No.",
  age: "Age",
  civilStatus: "Civil Status",
  sex: "Sex",
  bloodType: "Blood Type",
  qr: "QR Code",
  photo: "Photo",
};

// text-type fields offered in the "Add field" menu
const TEXT_FIELDS: Field[] = [
  "fullName",
  "position",
  "office",
  "address",
  "birthday",
  "phone",
  "age",
  "civilStatus",
  "sex",
  "bloodType",
];

const SIDE_LABEL: Record<Side, string> = { front: "Front", rear: "Rear" };

// Fonts that render identically in the editor, the browser print, AND the
// pdfkit PDF (its built-in families) — so what you pick is what prints.
const FONTS: Record<string, { label: string; css: string }> = {
  sans: { label: "Sans (Arial)", css: "Arial, Helvetica, sans-serif" },
  serif: { label: "Serif (Times)", css: "'Times New Roman', Times, serif" },
  mono: { label: "Mono (Courier)", css: "'Courier New', Courier, monospace" },
};
const fontCss = (key?: string) => (FONTS[key || "sans"] || FONTS.sans).css;

// Text outline as a multi-direction text-shadow (matches the print output,
// which uses text-shadow so the border reliably prints).
const outlineShadow = (w: number, c: string) =>
  (
    [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as [number, number][]
  )
    .map(([dx, dy]) => `${(dx * w).toFixed(2)}px ${(dy * w).toFixed(2)}px 0 ${c}`)
    .join(",");

const defaultPlaceholders = (): Placeholder[] => [
  { id: "ph-name", field: "fullName", xPct: 50, yPct: 68, fontSize: 18, color: "#111827", bold: true, align: "center" },
  { id: "ph-pos", field: "position", xPct: 50, yPct: 80, fontSize: 12, color: "#374151", bold: false, align: "center" },
];

const emptySides = (): Record<Side, SideData> => ({
  front: { image: null, placeholders: defaultPlaceholders() },
  rear: { image: null, placeholders: [] },
});

const BASE_W = 460; // card base width (= DESIGN_W; placeholder px reference)

// Keep the card mostly in view but allow a margin of breathing room so it
// isn't locked to the stage edges (you can pan a bit past, never fully out).
const clampView = (
  z: number,
  x: number,
  y: number,
  sw: number,
  sh: number,
  baseH: number,
) => {
  const cw = BASE_W * z;
  const ch = baseH * z;
  const mx = sw * 0.4; // horizontal margin
  const my = sh * 0.75; // generous top/bottom margin
  const xlo = Math.min(0, sw - cw) - mx;
  const xhi = Math.max(0, sw - cw) + mx;
  const ylo = Math.min(0, sh - ch) - my;
  const yhi = Math.max(0, sh - ch) + my;
  return {
    z,
    x: Math.max(xlo, Math.min(xhi, x)),
    y: Math.max(ylo, Math.min(yhi, y)),
  };
};

const IdCardMaker = () => {
  const { lineId } = useParams();
  const nav = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const storageKey = `idcard_tpl_${lineId ?? "default"}`;

  const [size, setSize] = useState<{ w: number; h: number; unit: "mm" | "in" }>(
    { w: 85.6, h: 54, unit: "mm" },
  );
  const [sides, setSides] = useState<Record<Side, SideData>>(emptySides());
  const [side, setSide] = useState<Side>("front");
  // intrinsic pixel size of each uploaded template (so dimensions stay true)
  const [natural, setNatural] = useState<Record<Side, { w: number; h: number } | null>>(
    { front: null, rear: null },
  );
  const [lockAspect, setLockAspect] = useState(true);
  // when true, the rear reuses the front design — no separate back to make
  const [sameBothSides, setSameBothSides] = useState(false);
  // optional alignment grid overlay (design aid only — never exported)
  const [showGrid, setShowGrid] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const draggingId = useRef<string | null>(null);
  // corner-resize state for image placeholders (photo / QR)
  const resizingRef = useRef<{
    id: string;
    cx: number;
    cy: number;
    square: boolean;
  } | null>(null);
  // pan/zoom canvas: z = scale, (x,y) = translation; pan on empty-space drag
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const viewZRef = useRef(1);
  viewZRef.current = view.z;
  const panRef = useRef<{
    px: number;
    py: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null>(null);

  const round1 = (n: number) => Math.round(n * 10) / 10;
  // read the real pixel dimensions of an image so the card matches the artwork
  const measure = (s: Side, dataUrl: string) => {
    const probe = new Image();
    probe.onload = () =>
      setNatural((prev) => ({
        ...prev,
        [s]: { w: probe.naturalWidth || 1, h: probe.naturalHeight || 1 },
      }));
    probe.src = dataUrl;
  };
  // current side, mirrored into a ref so the pointermove handler (bound once)
  // always mutates the side that's actually on screen.
  const sideRef = useRef<Side>(side);
  sideRef.current = side;

  const current = sides[side];
  const image = current.image;
  const placeholders = current.placeholders;
  const aspect = size.h > 0 ? size.w / size.h : 1.586;

  // side-scoped setters (used by render-scope event handlers)
  const setSideImage = (img: string | null) =>
    setSides((prev) => ({ ...prev, [side]: { ...prev[side], image: img } }));
  const setPlaceholders = (fn: (prev: Placeholder[]) => Placeholder[]) =>
    setSides((prev) => ({
      ...prev,
      [side]: { ...prev[side], placeholders: fn(prev[side].placeholders) },
    }));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.size?.w && p.size?.h) setSize(p.size);
      if (typeof p.sameBothSides === "boolean") setSameBothSides(p.sameBothSides);
      let next: Record<Side, SideData> | null = null;
      if (p.front || p.rear) {
        // two-sided format
        next = {
          front: {
            image: p.front?.image ?? null,
            placeholders: p.front?.placeholders?.length
              ? p.front.placeholders
              : defaultPlaceholders(),
          },
          rear: {
            image: p.rear?.image ?? null,
            placeholders: Array.isArray(p.rear?.placeholders)
              ? p.rear.placeholders
              : [],
          },
        };
      } else if (p.image) {
        // legacy single-sided → migrate to front
        next = {
          front: {
            image: p.image,
            placeholders: p.placeholders?.length
              ? p.placeholders
              : defaultPlaceholders(),
          },
          rear: { image: null, placeholders: [] },
        };
      }
      if (next) {
        setSides(next);
        if (next.front.image) measure("front", next.front.image);
        if (next.rear.image) measure("rear", next.rear.image);
      }
    } catch {
      /* ignore corrupt cache */
    }
  }, [storageKey]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const s = sideRef.current;
      const z = viewZRef.current || 1;
      // corner resize takes priority over move (delta is in screen px → /z)
      const rz = resizingRef.current;
      if (rz) {
        const newW = Math.max(
          20,
          Math.round((2 * Math.abs(e.clientX - rz.cx)) / z),
        );
        const newH = Math.max(
          20,
          Math.round((2 * Math.abs(e.clientY - rz.cy)) / z),
        );
        setSides((prev) => ({
          ...prev,
          [s]: {
            ...prev[s],
            placeholders: prev[s].placeholders.map((p) => {
              if (p.id !== rz.id) return p;
              return rz.square
                ? { ...p, size: Math.max(newW, newH) }
                : { ...p, size: newW, height: newH };
            }),
          },
        }));
        return;
      }
      const id = draggingId.current;
      if (id && cardRef.current) {
        // position is %-based, so it's correct at any zoom/pan
        const r = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        const clamp = (n: number) => Math.max(2, Math.min(98, n));
        setSides((prev) => ({
          ...prev,
          [s]: {
            ...prev[s],
            placeholders: prev[s].placeholders.map((p) =>
              p.id === id ? { ...p, xPct: clamp(x), yPct: clamp(y) } : p,
            ),
          },
        }));
        return;
      }
      // pan (drag on empty space) — clamped so the card stays in view
      const pan = panRef.current;
      if (pan) {
        const dx = e.clientX - pan.px;
        const dy = e.clientY - pan.py;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) pan.moved = true;
        setView((v) => {
          const st = stageRef.current;
          if (!st) return { ...v, x: pan.sx + dx, y: pan.sy + dy };
          return clampView(
            v.z,
            pan.sx + dx,
            pan.sy + dy,
            st.clientWidth,
            st.clientHeight,
            baseHRef.current,
          );
        });
      }
    };
    const onUp = () => {
      draggingId.current = null;
      resizingRef.current = null;
      // a click on empty space (no pan) clears the selection
      if (panRef.current && !panRef.current.moved) setSelectedId(null);
      panRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  // arrow keys nudge the selected placeholder (Shift = bigger step)
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      const dir: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const d = dir[e.key];
      if (!d) return;
      // don't hijack arrows while typing in a field
      const tag = (document.activeElement?.tagName || "").toUpperCase();
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      e.preventDefault();
      const step = e.shiftKey ? 2 : 0.5;
      const s = sideRef.current;
      const clamp = (n: number) => Math.max(2, Math.min(98, n));
      setSides((prev) => ({
        ...prev,
        [s]: {
          ...prev[s],
          placeholders: prev[s].placeholders.map((p) =>
            p.id === selectedId
              ? {
                  ...p,
                  xPct: clamp(p.xPct + d[0] * step),
                  yPct: clamp(p.yPct + d[1] * step),
                }
              : p,
          ),
        },
      }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  // ── Pan / zoom canvas ────────────────────────────────────────────────────
  const baseH = aspect > 0 ? BASE_W / aspect : BASE_W / 1.586;
  const baseHRef = useRef(baseH);
  baseHRef.current = baseH;

  const doFit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    if (!sw || !sh) return;
    const bh = baseHRef.current;
    const z = Math.min(sw / BASE_W, sh / bh) * 0.95;
    setView({ z, x: (sw - BASE_W * z) / 2, y: (sh - bh * z) / 2 });
  }, []);

  // fit on mount, when the card shape changes, and on resize
  useEffect(() => {
    const raf = requestAnimationFrame(() => doFit());
    const onResize = () => doFit();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [doFit, aspect]);

  // zoom toward the cursor on wheel
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      setView((v) => {
        const nz = Math.min(12, Math.max(0.15, v.z * factor));
        const cx = (mx - v.x) / v.z;
        const cy = (my - v.y) / v.z;
        return clampView(
          nz,
          mx - cx * nz,
          my - cy * nz,
          stage.clientWidth,
          stage.clientHeight,
          baseHRef.current,
        );
      });
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, []);

  const zoomTo = (nz: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const mx = stage.clientWidth / 2;
    const my = stage.clientHeight / 2;
    setView((v) => {
      const z = Math.min(12, Math.max(0.15, nz));
      const cx = (mx - v.x) / v.z;
      const cy = (my - v.y) / v.z;
      return clampView(
        z,
        mx - cx * z,
        my - cy * z,
        stage.clientWidth,
        stage.clientHeight,
        baseHRef.current,
      );
    });
  };
  // start a pan when pressing empty stage/card background
  const onStageDown = (e: React.PointerEvent) => {
    panRef.current = {
      px: e.clientX,
      py: e.clientY,
      sx: view.x,
      sy: view.y,
      moved: false,
    };
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error("Image is too large (max 12MB).");
      return;
    }
    const isPng = file.type === "image/png";
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const probe = new Image();
      probe.onload = () => {
        const nw = probe.naturalWidth || 1;
        const nh = probe.naturalHeight || 1;
        // High-res cap for print quality (2400px ≈ 700 DPI on an 85mm card,
        // ~470 DPI on a tall portrait). Opaque artwork is stored as high-q
        // JPEG (compact, so the resolution still fits localStorage); artwork
        // with transparency stays lossless PNG.
        const MAX_EDGE = 2400;
        const ratio = Math.min(1, MAX_EDGE / Math.max(nw, nh));
        const ow = Math.max(1, Math.round(nw * ratio));
        const oh = Math.max(1, Math.round(nh * ratio));
        let out = dataUrl;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = ow;
          canvas.height = oh;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(probe, 0, 0, ow, oh);
            // detect real transparency (many PNGs are actually opaque)
            let hasAlpha = false;
            if (isPng) {
              try {
                const d = ctx.getImageData(0, 0, ow, oh).data;
                for (let i = 3; i < d.length; i += 4) {
                  if (d[i] < 255) {
                    hasAlpha = true;
                    break;
                  }
                }
              } catch {
                hasAlpha = true; // can't inspect → preserve PNG
              }
            }
            out = hasAlpha
              ? canvas.toDataURL("image/png")
              : canvas.toDataURL("image/jpeg", 0.95);
          }
        } catch {
          out = dataUrl; // fall back to the original on any canvas error
        }
        setNatural((prev) => ({ ...prev, [side]: { w: ow, h: oh } }));
        setSideImage(out);
        // keep the card's true proportions: derive height from the artwork
        if (lockAspect) setSize((s) => ({ ...s, h: round1((s.w * oh) / ow) }));
      };
      probe.onerror = () => setSideImage(dataUrl);
      probe.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const switchSide = (s: Side) => {
    if (s === side) return;
    setSelectedId(null);
    setSide(s);
  };

  const selected = placeholders.find((p) => p.id === selectedId) ?? null;
  const patchSelected = (patch: Partial<Placeholder>) =>
    setPlaceholders((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, ...patch } : p)),
    );
  const removeSelected = () => {
    if (!selectedId) return;
    setPlaceholders((prev) => prev.filter((p) => p.id !== selectedId));
    setSelectedId(null);
  };

  const addPlaceholder = (field: Field) => {
    const id = `ph-${field}-${Date.now()}`;
    const pos: Record<Field, { x: number; y: number }> = {
      fullName: { x: 50, y: 60 },
      position: { x: 50, y: 68 },
      office: { x: 50, y: 74 },
      address: { x: 50, y: 80 },
      birthday: { x: 50, y: 82 },
      phone: { x: 50, y: 88 },
      age: { x: 50, y: 94 },
      civilStatus: { x: 30, y: 88 },
      sex: { x: 70, y: 88 },
      bloodType: { x: 70, y: 94 },
      qr: { x: 80, y: 75 },
      photo: { x: 30, y: 40 },
    };
    setPlaceholders((prev) => [
      ...prev,
      {
        id,
        field,
        xPct: pos[field].x,
        yPct: pos[field].y,
        fontSize: field === "fullName" ? 18 : 12,
        color: "#111827",
        bold: field === "fullName",
        align: "center",
        ...(field === "qr" ? { size: 70 } : {}),
        ...(field === "photo" ? { size: 90, height: 110 } : {}),
      },
    ]);
    setSelectedId(id);
  };

  // when front == rear, the saved rear mirrors the front design
  const payload = () => {
    const rear = sameBothSides ? sides.front : sides.rear;
    return JSON.stringify({ size, sameBothSides, front: sides.front, rear });
  };

  const saveTemplate = () => {
    if (!sides.front.image) {
      toast.error("Upload the front template before saving.");
      return;
    }
    try {
      localStorage.setItem(storageKey, payload());
      const both = !sameBothSides && sides.front.image && sides.rear.image;
      toast.success(
        sameBothSides
          ? "Template saved (front used on both sides)"
          : both
            ? "Template saved (front + rear) — use it from the Issue IDs page"
            : "Template saved — use it from the Issue IDs page",
      );
    } catch {
      toast.error("Couldn't save (template images may be too large).");
    }
  };

  const resetTemplate = () => {
    setPlaceholders(() => (side === "front" ? defaultPlaceholders() : []));
    setSelectedId(null);
  };

  // Persist the latest design (if any), then open the Issue page so it always
  // reflects what's on screen — no separate Save click required.
  const goToIssue = () => {
    if (sides.front.image) {
      try {
        localStorage.setItem(storageKey, payload());
      } catch {
        toast.error("Couldn't save (template images may be too large).");
      }
    }
    nav("../tools/id-card/issue");
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-white border-b px-4 py-2.5 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1 text-xs"
          onClick={() => nav("../tools")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tools
        </Button>
        <div className="p-1.5 bg-indigo-600 rounded-md">
          <IdCard className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold text-gray-900">
            ID Card Maker — Template
          </h1>
          <p className="text-[11px] text-gray-500 leading-none mt-0.5">
            Design the front &amp; rear. Issue real IDs from the Issue page.
          </p>
        </div>
        <Button
          size="sm"
          variant={showGrid ? "default" : "outline"}
          className={
            "h-8 gap-1.5 text-xs " +
            (showGrid ? "bg-indigo-600 hover:bg-indigo-700" : "")
          }
          onClick={() => setShowGrid((g) => !g)}
          title="Toggle alignment grid (design aid only — never printed)"
        >
          <Grid3x3 className="h-3.5 w-3.5" />
          Grid
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onUpload}
          />
          <span className="inline-flex items-center gap-1.5 h-8 px-3 text-xs rounded-md border bg-white hover:bg-gray-50">
            <Upload className="h-3.5 w-3.5" />
            {image ? "Replace" : "Upload"} {SIDE_LABEL[side].toLowerCase()}
          </span>
        </label>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={saveTemplate}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700"
          onClick={goToIssue}
          title="Use this template to issue & print real employee IDs"
        >
          Issue IDs
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* ── Card canvas ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-2 lg:sticky lg:top-4 lg:self-start">
            <div
              ref={stageRef}
              onPointerDown={onStageDown}
              onDoubleClick={doFit}
              onDragStart={(e) => e.preventDefault()}
              className="relative w-full overflow-hidden rounded-lg border bg-gray-100/70 cursor-grab active:cursor-grabbing select-none"
              style={{ height: "calc(100vh - 7rem)", touchAction: "none" }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transformOrigin: "0 0",
                  transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`,
                }}
              >
                <div
                  ref={cardRef}
                  className="relative overflow-hidden shadow-sm border bg-white"
                  style={{ width: BASE_W, height: baseH }}
                >
              {image ? (
                <img
                  src={image}
                  alt={`ID template ${side}`}
                  className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 gap-2">
                  <ImageOff className="h-8 w-8" />
                  <p className="text-xs text-gray-400">
                    {size.w} × {size.h} {size.unit} · upload the{" "}
                    {SIDE_LABEL[side].toLowerCase()} template
                  </p>
                </div>
              )}

              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      // fine 5% grid (faint) + bold 10% grid (clear) so lines
                      // read over any template background
                      "linear-gradient(to right, rgba(79,70,229,0.25) 1px, transparent 1px)," +
                      "linear-gradient(to bottom, rgba(79,70,229,0.25) 1px, transparent 1px)," +
                      "linear-gradient(to right, rgba(79,70,229,0.6) 1px, transparent 1px)," +
                      "linear-gradient(to bottom, rgba(79,70,229,0.6) 1px, transparent 1px)",
                    backgroundSize: "5% 5%, 5% 5%, 10% 10%, 10% 10%",
                  }}
                >
                  {/* bold center guides */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-rose-500/80" />
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-rose-500/80" />
                </div>
              )}

              {placeholders.map((p) => {
                const isSel = p.id === selectedId;
                const onDown = (e: React.PointerEvent) => {
                  e.stopPropagation();
                  setSelectedId(p.id);
                  draggingId.current = p.id;
                };
                const onResizeDown = (e: React.PointerEvent) => {
                  e.stopPropagation();
                  if (!cardRef.current) return;
                  const r = cardRef.current.getBoundingClientRect();
                  resizingRef.current = {
                    id: p.id,
                    cx: r.left + (p.xPct / 100) * r.width,
                    cy: r.top + (p.yPct / 100) * r.height,
                    square: p.field === "qr",
                  };
                  setSelectedId(p.id);
                };
                if (p.field === "qr" || p.field === "photo") {
                  const w = p.size || (p.field === "qr" ? 70 : 90);
                  const h = p.field === "qr" ? w : p.height || 110;
                  return (
                    <div
                      key={p.id}
                      onPointerDown={onDown}
                      className={
                        "absolute cursor-move " +
                        (isSel ? "outline outline-1 outline-indigo-400 outline-dashed" : "")
                      }
                      style={{
                        left: `${p.xPct}%`,
                        top: `${p.yPct}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div
                        className="relative border border-dashed border-gray-400 bg-white/70 flex items-center justify-center text-[8px] text-gray-500"
                        style={{ width: w, height: h }}
                      >
                        {p.field === "qr" ? "QR" : "PHOTO"}
                        {isSel && (
                          <div
                            onPointerDown={onResizeDown}
                            title="Drag to resize"
                            className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-sm bg-indigo-500 border border-white cursor-nwse-resize"
                          />
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={p.id}
                    onPointerDown={onDown}
                    className={
                      "absolute cursor-move whitespace-nowrap px-0.5 " +
                      (isSel ? "outline outline-1 outline-indigo-400 outline-dashed" : "")
                    }
                    style={{
                      left: `${p.xPct}%`,
                      top: `${p.yPct}%`,
                      transform: "translate(-50%, -50%)",
                      fontSize: p.fontSize,
                      color: p.color,
                      opacity: 0.85,
                      fontWeight: p.bold ? 700 : 400,
                      textAlign: p.align,
                      fontFamily: fontCss(p.fontFamily),
                      textShadow:
                        p.strokeWidth && p.strokeWidth > 0
                          ? outlineShadow(
                              p.strokeWidth,
                              p.strokeColor || "#ffffff",
                            )
                          : undefined,
                    }}
                  >
                    {`{${FIELD_LABEL[p.field]}}`}
                  </div>
                );
              })}
                </div>
              </div>

              {/* zoom slider — overlay */}
              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 flex items-center gap-2 rounded-md border bg-white/90 px-2 py-1 shadow-sm"
              >
                <ZoomOut
                  className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => zoomTo(view.z / 1.2)}
                />
                <input
                  type="range"
                  min={0.25}
                  max={4}
                  step={0.01}
                  value={Math.min(4, Math.max(0.25, view.z))}
                  onChange={(e) => zoomTo(+e.target.value)}
                  title="Zoom"
                  className="w-24 accent-indigo-600 cursor-pointer"
                />
                <ZoomIn
                  className="h-3.5 w-3.5 text-gray-400 cursor-pointer hover:text-gray-600"
                  onClick={() => zoomTo(view.z * 1.2)}
                />
                <button
                  type="button"
                  onClick={doFit}
                  title="Fit to view"
                  className="w-10 text-center text-[11px] tabular-nums text-gray-600 hover:text-indigo-600"
                >
                  {Math.round(view.z * 100)}%
                </button>
              </div>

              {/* hint — bottom overlay */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
                <span className="inline-block rounded bg-white/85 px-2 py-0.5 text-[10px] text-gray-600 shadow-sm whitespace-nowrap">
                  {SIDE_LABEL[side]} · drag or arrow-keys to move · scroll to
                  zoom · drag empty space to pan
                </span>
              </div>
            </div>
          </div>

          {/* ── Settings panel (side + size + placeholders) ──────────── */}
          <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
            {/* Side */}
            <div className="border rounded-lg bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-800">1 · Side</h4>
                <span className="text-[10px] text-gray-400">
                  Switch anytime
                </span>
              </div>
              <div className="inline-flex w-full rounded-md border bg-gray-50 p-0.5">
                {(["front", "rear"] as const).map((s) => {
                  const disabled = sameBothSides && s === "rear";
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={disabled}
                      onClick={() => switchSide(s)}
                      className={
                        "flex-1 inline-flex items-center justify-center gap-1.5 h-7 rounded text-xs font-medium transition " +
                        (disabled
                          ? "text-gray-300 cursor-not-allowed"
                          : side === s
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-gray-600 hover:bg-white")
                      }
                    >
                      {SIDE_LABEL[s]}
                      {sides[s].image && !disabled && (
                        <Check
                          className={
                            "h-3 w-3 " +
                            (side === s ? "text-white" : "text-emerald-500")
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer select-none mt-2">
                <input
                  type="checkbox"
                  checked={sameBothSides}
                  onChange={(e) => {
                    setSameBothSides(e.target.checked);
                    if (e.target.checked) {
                      setSelectedId(null);
                      setSide("front");
                    }
                  }}
                  className="h-3.5 w-3.5 accent-indigo-600"
                />
                Front and rear are the same
              </label>
              {sameBothSides ? (
                <p className="text-[10px] text-gray-400 mt-1">
                  The rear will use the front design.
                </p>
              ) : (
                side === "rear" &&
                !sides.rear.image && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Rear is optional — upload a back image to design it.
                  </p>
                )
              )}
            </div>

            {/* Card size */}
            <div className="border rounded-lg bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-gray-800">
                  2 · Card size
                </h4>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => setSize({ w: 85.6, h: 54, unit: "mm" })}
                  >
                    CR80
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => setSize({ w: 54, h: 85.6, unit: "mm" })}
                  >
                    Portrait
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Width</Label>
                  <Input
                    type="number"
                    min={1}
                    step="0.1"
                    value={size.w}
                    onChange={(e) => {
                      const w = Math.max(1, Number(e.target.value) || 0);
                      const nat = natural[side];
                      setSize((s) =>
                        lockAspect && nat
                          ? { ...s, w, h: round1((w * nat.h) / nat.w) }
                          : { ...s, w },
                      );
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Height</Label>
                  <Input
                    type="number"
                    min={1}
                    step="0.1"
                    value={size.h}
                    disabled={lockAspect && !!natural[side]}
                    title={
                      lockAspect && natural[side]
                        ? "Auto-kept to the template's aspect ratio"
                        : undefined
                    }
                    onChange={(e) =>
                      setSize((s) => ({
                        ...s,
                        h: Math.max(1, Number(e.target.value) || 0),
                      }))
                    }
                    className="h-7 text-xs disabled:opacity-60 disabled:bg-gray-50"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Unit</Label>
                  <select
                    value={size.unit}
                    onChange={(e) =>
                      setSize((s) => ({
                        ...s,
                        unit: e.target.value as "mm" | "in",
                      }))
                    }
                    className="h-7 text-xs w-full border rounded-md px-1.5 bg-white"
                  >
                    <option value="mm">mm</option>
                    <option value="in">in</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-1.5 text-[10px] text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                    className="h-3 w-3 accent-indigo-600"
                  />
                  <Lock className="h-3 w-3" />
                  Lock ratio
                </label>
                {natural[side] && (
                  <span className="text-[10px] text-gray-400">
                    {natural[side]!.w}×{natural[side]!.h}px
                  </span>
                )}
              </div>
            </div>

            <div className="border rounded-lg bg-white p-3 space-y-2">
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold text-gray-800">
                  3 · Placeholders
                  <span className="ml-1 font-normal text-gray-400">
                    ({SIDE_LABEL[side]})
                  </span>
                </h4>
                <div className="flex gap-1 items-center">
                  <select
                    value=""
                    onChange={(e) => {
                      const v = e.target.value as Field;
                      if (v) addPlaceholder(v);
                      e.currentTarget.value = "";
                    }}
                    className="h-6 text-[10px] border rounded px-1 bg-white flex-1 min-w-0"
                    title="Add a text field placeholder"
                  >
                    <option value="">+ Add field…</option>
                    {TEXT_FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {FIELD_LABEL[f]}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-1.5 text-[10px] gap-1"
                    onClick={() => addPlaceholder("photo")}
                  >
                    <ImageIcon className="h-3 w-3" />
                    Photo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-1.5 text-[10px] gap-1"
                    onClick={() => addPlaceholder("qr")}
                  >
                    <QrCode className="h-3 w-3" />
                    QR
                  </Button>
                </div>
              </div>

              {selected ? (
                <div className="space-y-2.5 pt-1">
                  <p className="text-[10px] text-gray-500">
                    Editing:{" "}
                    <span className="font-medium text-gray-700">
                      {FIELD_LABEL[selected.field]}
                    </span>
                  </p>
                  {selected.field === "qr" || selected.field === "photo" ? (
                    <div className="space-y-2">
                      {selected.field === "qr" ? (
                        <div className="space-y-1">
                          <Label className="text-[10px]">QR size (px)</Label>
                          <Input
                            type="number"
                            min={30}
                            max={240}
                            value={selected.size ?? 70}
                            onChange={(e) =>
                              patchSelected({
                                size: Math.max(30, Number(e.target.value) || 30),
                              })
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Width (px)</Label>
                            <Input
                              type="number"
                              min={30}
                              max={400}
                              value={selected.size ?? 90}
                              onChange={(e) =>
                                patchSelected({
                                  size: Math.max(30, Number(e.target.value) || 30),
                                })
                              }
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Height (px)</Label>
                            <Input
                              type="number"
                              min={30}
                              max={400}
                              value={selected.height ?? 110}
                              onChange={(e) =>
                                patchSelected({
                                  height: Math.max(30, Number(e.target.value) || 30),
                                })
                              }
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 w-full text-[10px] gap-1 text-red-600 hover:bg-red-50"
                        onClick={removeSelected}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Font</Label>
                        <select
                          value={selected.fontFamily || "sans"}
                          onChange={(e) =>
                            patchSelected({ fontFamily: e.target.value })
                          }
                          className="h-7 text-xs w-full border rounded-md px-1.5 bg-white"
                          style={{ fontFamily: fontCss(selected.fontFamily) }}
                        >
                          {Object.entries(FONTS).map(([k, v]) => (
                            <option key={k} value={k} style={{ fontFamily: v.css }}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Font size</Label>
                          <Input
                            type="number"
                            min={6}
                            max={72}
                            value={selected.fontSize}
                            onChange={(e) =>
                              patchSelected({
                                fontSize: Math.max(6, Number(e.target.value) || 6),
                              })
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Color</Label>
                          <input
                            type="color"
                            value={selected.color}
                            onChange={(e) =>
                              patchSelected({ color: e.target.value })
                            }
                            className="h-7 w-full rounded border cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Border (px)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={20}
                            step="0.5"
                            value={selected.strokeWidth ?? 0}
                            onChange={(e) =>
                              patchSelected({
                                strokeWidth: Math.max(
                                  0,
                                  Number(e.target.value) || 0,
                                ),
                              })
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Border color</Label>
                          <input
                            type="color"
                            value={selected.strokeColor || "#ffffff"}
                            onChange={(e) =>
                              patchSelected({ strokeColor: e.target.value })
                            }
                            className="h-7 w-full rounded border cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant={selected.bold ? "default" : "outline"}
                          className="h-7 w-7 p-0"
                          onClick={() => patchSelected({ bold: !selected.bold })}
                        >
                          <Bold className="h-3.5 w-3.5" />
                        </Button>
                        {(["left", "center", "right"] as const).map((a) => {
                          const Icon =
                            a === "left"
                              ? AlignLeft
                              : a === "center"
                                ? AlignCenter
                                : AlignRight;
                          return (
                            <Button
                              key={a}
                              size="sm"
                              variant={
                                selected.align === a ? "default" : "outline"
                              }
                              className="h-7 w-7 p-0"
                              onClick={() => patchSelected({ align: a })}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </Button>
                          );
                        })}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 ml-auto text-[10px] gap-1 text-red-600 hover:bg-red-50"
                          onClick={removeSelected}
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 py-1">
                  Click a placeholder on the {SIDE_LABEL[side].toLowerCase()}{" "}
                  card to style it.
                </p>
              )}
            </div>

            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] gap-1.5 text-gray-500 w-full"
              onClick={resetTemplate}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset {SIDE_LABEL[side].toLowerCase()} placeholders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdCardMaker;
