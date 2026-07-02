import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import { idIssueList, idExportBatch, type IdExportPaper } from "@/db/statement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  IdCard,
  ArrowLeft,
  Download,
  Loader2,
  PanelsTopLeft,
  Users,
  FileText,
  ImageOff,
  ZoomIn,
  ZoomOut,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
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
const FIELD_LABEL: Record<Field, string> = {
  fullName: "Name",
  position: "Position",
  office: "Office",
  address: "Address",
  birthday: "Birthday",
  phone: "Phone",
  age: "Age",
  civilStatus: "Civil Status",
  sex: "Sex",
  bloodType: "Blood Type",
  qr: "QR",
  photo: "Photo",
};
interface Placeholder {
  id: string;
  field: Field;
  xPct: number;
  yPct: number;
  fontSize: number;
  color: string;
  bold: boolean;
  align: "left" | "center" | "right";
  size?: number;
  height?: number;
  strokeWidth?: number;
  strokeColor?: string;
  fontFamily?: string;
}
interface SideData {
  image: string | null;
  placeholders: Placeholder[];
}
interface Template {
  size: { w: number; h: number; unit: "mm" | "in" };
  front: SideData;
  rear: SideData;
  sameBothSides?: boolean;
}

interface Employee {
  userId: string;
  fullName: string;
  position: string;
  photoUrl: string | null;
  departmentId: string;
  office: string;
}

const DESIGN_W = 460;
// paper sizes in mm (portrait)
const PAPER_MM: Record<string, [number, number]> = {
  A4: [210, 297],
  Letter: [215.9, 279.4],
  "Folio 8.5×13": [215.9, 330.2],
  Legal: [215.9, 355.6],
  A3: [297, 420],
};

const FONT_CSS: Record<string, string> = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "'Times New Roman', Times, serif",
  mono: "'Courier New', Courier, monospace",
};
const fontCss = (key?: string) => FONT_CSS[key || "sans"] || FONT_CSS.sans;

// Text outline as a multi-direction text-shadow (matches print output).
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

const downloadPdf = (b64: string, name: string) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const IdCardBatch = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const storageKey = `idcard_tpl_${lineId ?? "default"}`;

  const [tpl, setTpl] = useState<Template | null>(null);
  const [list, setList] = useState<Employee[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [listOpen, setListOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [unit, setUnit] = useState<string | null>(null); // selected office/unit
  const [apiUnits, setApiUnits] = useState<{ id: string; name: string }[]>([]);
  // per-employee editable name (override) — for long names you can shorten/split
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  // per-employee name font multiplier (shrink a long name)
  const [nameScales, setNameScales] = useState<Record<string, number>>({});
  const bumpNameScale = (id: string, delta: number) =>
    setNameScales((prev) => ({
      ...prev,
      [id]: Math.min(2, Math.max(0.4, +((prev[id] ?? 1) + delta).toFixed(2))),
    }));
  const [exporting, setExporting] = useState(false);

  // paper / layout options
  const [paperSize, setPaperSize] = useState("A4");
  const [orientation, setOrientation] =
    useState<"portrait" | "landscape">("portrait");
  // ≥8mm keeps cards inside the printer's printable area so it doesn't
  // auto-shrink the whole sheet (which makes every card print too small).
  const [marginMm, setMarginMm] = useState(8);
  const [gapMm, setGapMm] = useState(4);
  const [flip, setFlip] = useState<"long" | "short">("long");
  const [cutMarks, setCutMarks] = useState(true);
  const [previewSide, setPreviewSide] = useState<"front" | "rear">("front");
  // pan/zoom canvas state: z = scale, (x,y) = translation in stage px
  const stageRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const panRef = useRef<{
    px: number;
    py: number;
    sx: number;
    sy: number;
  } | null>(null);

  // load the saved template (same shape/migration as the Issue page)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const p = JSON.parse(raw);
      let t: Template | null = null;
      if (p.size?.w && (p.front?.image || p.rear?.image)) {
        t = {
          size: p.size,
          sameBothSides: !!p.sameBothSides,
          front: {
            image: p.front?.image ?? null,
            placeholders: Array.isArray(p.front?.placeholders)
              ? p.front.placeholders
              : [],
          },
          rear: {
            image: p.rear?.image ?? null,
            placeholders: Array.isArray(p.rear?.placeholders)
              ? p.rear.placeholders
              : [],
          },
        };
      } else if (p.image && p.size?.w) {
        t = {
          size: p.size,
          front: {
            image: p.image,
            placeholders: Array.isArray(p.placeholders) ? p.placeholders : [],
          },
          rear: { image: null, placeholders: [] },
        };
      }
      if (t) setTpl(t);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  // load every active employee
  useEffect(() => {
    let on = true;
    setLoadingList(true);
    idIssueList(auth.token as string, lineId as string)
      .then((r) => {
        if (!on) return;
        setList(r.list);
        setApiUnits(r.units);
        setSelected(new Set(r.list.map((e) => e.userId)));
      })
      .catch(() => on && toast.error("Couldn't load the employee list."))
      .finally(() => on && setLoadingList(false));
    return () => {
      on = false;
    };
  }, [auth.token, lineId]);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  // every unit/office on the line (from the API) — even ones with no personnel
  const units = useMemo(() => {
    const all = [...apiUnits].sort((a, b) => a.name.localeCompare(b.name));
    // add "(No unit)" only if some employee isn't assigned to any unit
    if (list.some((e) => !e.departmentId))
      all.push({ id: "", name: "(No unit)" });
    return all;
  }, [apiUnits, list]);

  // default to the first unit once it loads (no "All" view)
  useEffect(() => {
    if (unit === null && units.length) setUnit(units[0].id);
  }, [units, unit]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return list.filter((e) => {
      if (unit !== null && e.departmentId !== unit) return false;
      if (!q) return true;
      return (
        e.fullName.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q)
      );
    });
  }, [list, debouncedQuery, unit]);

  // "select all" acts on the currently-shown (filtered) employees
  const allSelected =
    filtered.length > 0 && filtered.every((e) => selected.has(e.userId));
  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((e) => next.delete(e.userId));
      else filtered.forEach((e) => next.add(e.userId));
      return next;
    });
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // live imposition + on-screen sheet geometry (mirrors the backend math)
  const fit = useMemo(() => {
    if (!tpl) return null;
    let [pw, ph] = PAPER_MM[paperSize] ?? PAPER_MM.A4;
    if (orientation === "landscape") [pw, ph] = [ph, pw];
    const cw = tpl.size.unit === "in" ? tpl.size.w * 25.4 : tpl.size.w;
    const ch = tpl.size.unit === "in" ? tpl.size.h * 25.4 : tpl.size.h;
    const cols = Math.max(1, Math.floor((pw - 2 * marginMm + gapMm) / (cw + gapMm)));
    const rows = Math.max(1, Math.floor((ph - 2 * marginMm + gapMm) / (ch + gapMm)));
    const perPage = cols * rows;
    const pages = Math.max(1, Math.ceil(selected.size / perPage));
    // centered grid (symmetric margins) — same as the exported sheet
    const gridW = cols * cw + (cols - 1) * gapMm;
    const gridH = rows * ch + (rows - 1) * gapMm;
    const startX = (pw - gridW) / 2;
    const startY = (ph - gridH) / 2;
    // scale the real page (mm) down to an on-screen sheet
    const PAGE_MAX_W = 430;
    const PAGE_MAX_H = 560;
    const pAspect = pw / ph;
    const dispW = pAspect >= 1 ? PAGE_MAX_W : Math.round(PAGE_MAX_H * pAspect);
    const dispH = pAspect >= 1 ? Math.round(PAGE_MAX_W / pAspect) : PAGE_MAX_H;
    const pxPerMM = dispW / pw;
    return {
      cols,
      rows,
      perPage,
      pages,
      cw,
      ch,
      startX,
      startY,
      dispW,
      dispH,
      pxPerMM,
    };
  }, [tpl, paperSize, orientation, marginMm, gapMm, selected.size]);

  // ── Pan / zoom canvas ────────────────────────────────────────────────────
  const dispW = fit?.dispW ?? 0;
  const dispH = fit?.dispH ?? 0;
  const doFit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage || !dispW || !dispH) return;
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    if (!sw || !sh) return;
    const z = Math.min(sw / dispW, sh / dispH) * 0.94;
    setView({ z, x: (sw - dispW * z) / 2, y: (sh - dispH * z) / 2 });
  }, [dispW, dispH]);

  // re-fit whenever the sheet size changes (paper/orientation) or the window resizes
  useEffect(() => {
    doFit();
    const onResize = () => doFit();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [doFit]);

  // zoom toward the cursor on wheel (non-passive so we can prevent page scroll)
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
        return { z: nz, x: mx - cx * nz, y: my - cy * nz };
      });
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [tpl]);

  const zoomTo = (nz: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const mx = stage.clientWidth / 2;
    const my = stage.clientHeight / 2;
    setView((v) => {
      const z = Math.min(12, Math.max(0.15, nz));
      const cx = (mx - v.x) / v.z;
      const cy = (my - v.y) / v.z;
      return { z, x: mx - cx * z, y: my - cy * z };
    });
  };
  const onPanDown = (e: React.PointerEvent) => {
    panRef.current = { px: e.clientX, py: e.clientY, sx: view.x, sy: view.y };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPanMove = (e: React.PointerEvent) => {
    const p = panRef.current;
    if (!p) return;
    setView((v) => ({
      ...v,
      x: p.sx + (e.clientX - p.px),
      y: p.sy + (e.clientY - p.py),
    }));
  };
  const onPanUp = () => {
    panRef.current = null;
  };

  // does the template require an employee photo?
  const templateNeedsPhoto = useMemo(() => {
    if (!tpl) return false;
    const rear = tpl.sameBothSides ? tpl.front : tpl.rear;
    return [
      ...tpl.front.placeholders,
      ...(rear?.placeholders ?? []),
    ].some((p) => p.field === "photo");
  }, [tpl]);

  // selected employees with no uploaded picture (invalid when a photo is needed)
  const missingPhoto = useMemo(
    () =>
      templateNeedsPhoto
        ? list.filter((e) => selected.has(e.userId) && !e.photoUrl)
        : [],
    [templateNeedsPhoto, list, selected],
  );

  const onExport = async () => {
    if (!tpl) return;
    if (selected.size === 0) {
      toast.error("Select at least one employee.");
      return;
    }
    if (templateNeedsPhoto && missingPhoto.length > 0) {
      toast.error(
        `${missingPhoto.length} selected employee(s) have no uploaded photo, which this template requires. Deselect them or upload their picture.`,
      );
      return;
    }
    setExporting(true);
    try {
      const paper: IdExportPaper = {
        size: paperSize,
        orientation,
        marginMm,
        gapMm,
        flip,
        cutMarks,
      };
      const res = await idExportBatch(auth.token as string, {
        lineId: lineId as string,
        userIds: list.filter((e) => selected.has(e.userId)).map((e) => e.userId),
        template: tpl,
        paper,
        nameOverrides,
        nameScales,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadPdf(res.front, `ID-cards-FRONT-${stamp}.pdf`);
      if (res.rear) downloadPdf(res.rear, `ID-cards-REAR-${stamp}.pdf`);
      toast.success(
        `Exported ${res.meta.count} ID${res.meta.count === 1 ? "" : "s"} · ${res.meta.perPage}/page · ${res.meta.pages} page${res.meta.pages === 1 ? "" : "s"}${res.rear ? " (front + rear files)" : ""}`,
      );
    } catch (err) {
      const data = (err as { response?: { data?: { error?: string; message?: string } } })
        ?.response?.data;
      toast.error(
        data?.error === "MISSING_PHOTO"
          ? data.message || "Some employees have no uploaded photo."
          : "Export failed — please try again.",
      );
    } finally {
      setExporting(false);
    }
  };

  // ── No template ──────────────────────────────────────────────────────────
  if (!tpl) {
    return (
      <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
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
          <h1 className="text-sm font-semibold text-gray-900">Bulk ID Export</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <PanelsTopLeft className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-700">
              No saved template
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Design and save an ID template first, then export everyone's IDs
              here.
            </p>
            <Button
              size="sm"
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => nav("../tools/id-card")}
            >
              Go to ID Card Maker
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedEmployees = list.filter((e) => selected.has(e.userId));

  // one ID card on the sheet, filled with an employee (or blank design)
  const renderCard = (
    side: SideData,
    emp: Employee | undefined,
    key: number,
    left: number,
    top: number,
    wPx: number,
    hPx: number,
  ) => {
    const cs = wPx / DESIGN_W; // placeholder px are authored at DESIGN_W
    return (
      <div
        key={key}
        className="absolute overflow-hidden bg-white"
        style={{ left, top, width: wPx, height: hPx, outline: "0.5px solid rgba(0,0,0,0.18)" }}
      >
        {side.image && (
          <img
            src={side.image}
            alt=""
            className="absolute inset-0 w-full h-full object-fill"
          />
        )}
        {side.placeholders.map((p) => {
          if (p.field === "qr" || p.field === "photo") {
            const isQr = p.field === "qr";
            const w = (p.size || (isQr ? 70 : 90)) * cs;
            const h = (isQr ? p.size || 70 : p.height || 110) * cs;
            const pos = {
              left: `${p.xPct}%`,
              top: `${p.yPct}%`,
              transform: "translate(-50%,-50%)",
              width: w,
              height: h,
            } as const;
            if (!isQr && emp?.photoUrl) {
              return (
                <img
                  key={p.id}
                  src={emp.photoUrl}
                  alt=""
                  className="absolute object-cover"
                  style={pos}
                />
              );
            }
            return (
              <div
                key={p.id}
                className="absolute border border-dashed border-gray-300 bg-white/60 flex items-center justify-center text-gray-400"
                style={{ ...pos, fontSize: Math.max(4, 6 * cs) }}
              >
                {isQr ? "QR" : "PHOTO"}
              </div>
            );
          }
          // batch preview only knows name/position; other fields fill in the PDF
          const isName = p.field === "fullName";
          const text = isName
            ? emp
              ? nameOverrides[emp.userId] ?? emp.fullName
              : undefined
            : p.field === "position"
              ? emp?.position
              : undefined;
          return (
            <div
              key={p.id}
              className={"absolute " + (isName ? "text-center leading-tight" : "whitespace-nowrap")}
              style={{
                left: `${p.xPct}%`,
                top: `${p.yPct}%`,
                transform: "translate(-50%,-50%)",
                fontSize:
                  p.fontSize *
                  cs *
                  (isName && emp ? nameScales[emp.userId] ?? 1 : 1),
                color: text ? p.color : "#9ca3af",
                fontWeight: p.bold ? 700 : 400,
                fontFamily: fontCss(p.fontFamily),
                textShadow:
                  text && p.strokeWidth && p.strokeWidth > 0
                    ? outlineShadow(p.strokeWidth * cs, p.strokeColor || "#ffffff")
                    : undefined,
                // long names wrap to multiple lines within the card
                ...(isName
                  ? { width: wPx * 0.92, whiteSpace: "normal" as const }
                  : {}),
              }}
            >
              {text || `{${FIELD_LABEL[p.field]}}`}
            </div>
          );
        })}
      </div>
    );
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
            Bulk ID Export
          </h1>
          <p className="text-[11px] text-gray-500 leading-none mt-0.5">
            Select everyone, pick a paper size, export front &amp; rear PDFs.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => nav("../tools/id-card/issue")}
        >
          Single issue
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700"
          disabled={
            exporting ||
            selected.size === 0 ||
            (templateNeedsPhoto && missingPhoto.length > 0)
          }
          onClick={onExport}
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export PDF
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div
          className={
            "max-w-6xl mx-auto grid grid-cols-1 gap-4 " +
            (listOpen
              ? "lg:grid-cols-[260px_1fr_300px]"
              : "lg:grid-cols-[2.25rem_1fr_300px]")
          }
        >
          {/* ── Employee list — collapses to a left rail for more preview room ── */}
          {!listOpen ? (
            <button
              type="button"
              onClick={() => setListOpen(true)}
              title="Show employees"
              className="hidden lg:flex flex-col items-center gap-2 border rounded-lg bg-white py-3 hover:bg-gray-50 lg:sticky lg:top-4 lg:self-start"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
              <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-medium text-gray-600 tracking-wide whitespace-nowrap">
                Employees ({selected.size}/{list.length})
              </span>
            </button>
          ) : (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="sticky top-0 z-10 bg-gray-50 border-b">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  Employees
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">
                    {selected.size} / {list.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setListOpen(false)}
                    title="Collapse panel"
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* unit / office filter — no "All" option */}
              {units.length > 0 && (
                <div className="px-3 pb-2">
                  <select
                    value={unit ?? ""}
                    onChange={(e) => setUnit(e.target.value)}
                    title="Filter by unit / office"
                    className="h-7 text-xs w-full border rounded-md px-1.5 bg-white font-medium text-gray-700"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {listOpen && (
                <div className="flex items-center gap-2 px-3 pb-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    title="Select all in this unit"
                    className="h-3.5 w-3.5 accent-indigo-600 flex-none"
                  />
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search name or position…"
                      className="w-full h-7 pl-7 pr-7 text-xs border rounded-md bg-white"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            {listOpen && (
            <div className="divide-y">
              {loadingList ? (
                <div className="h-40 flex items-center justify-center text-gray-300">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : list.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-gray-400">
                  No active employees found.
                </div>
              ) : filtered.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-gray-400">
                  {debouncedQuery
                    ? `No match for “${debouncedQuery}” in this unit.`
                    : "No employees in this unit."}
                </div>
              ) : (
                filtered.map((e) => {
                  const on = selected.has(e.userId);
                  return (
                    <div
                      key={e.userId}
                      className={
                        "flex items-center gap-3 px-3 py-2 " +
                        (on ? "bg-indigo-50/40" : "")
                      }
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleOne(e.userId)}
                        className="h-3.5 w-3.5 accent-indigo-600 flex-none cursor-pointer"
                      />
                      {e.photoUrl ? (
                        <img
                          src={e.photoUrl}
                          alt=""
                          onClick={() => toggleOne(e.userId)}
                          className="h-7 w-7 rounded-full object-cover flex-none ring-1 ring-gray-100 cursor-pointer"
                        />
                      ) : (
                        <div
                          onClick={() => toggleOne(e.userId)}
                          className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 flex-none cursor-pointer"
                        >
                          {(e.fullName?.[0] ?? "?").toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={nameOverrides[e.userId] ?? e.fullName}
                          onChange={(ev) =>
                            setNameOverrides((prev) => ({
                              ...prev,
                              [e.userId]: ev.target.value,
                            }))
                          }
                          title="Name shown on the card — edit it (long names wrap to two lines)"
                          className="w-full text-xs font-medium text-gray-800 bg-transparent border border-transparent rounded px-1 -mx-1 outline-none hover:border-gray-200 focus:border-indigo-300 focus:bg-white"
                        />
                        {e.position && (
                          <p className="text-[11px] text-gray-500 truncate px-1 -mx-1">
                            {e.position}
                          </p>
                        )}
                      </div>
                      {/* per-employee name font size */}
                      <div
                        className="flex items-center gap-0.5 flex-none"
                        title="Name font size on the card"
                      >
                        <button
                          type="button"
                          onClick={() => bumpNameScale(e.userId, -0.1)}
                          className="h-5 w-5 rounded border text-[11px] leading-none text-gray-600 hover:bg-gray-100"
                        >
                          A−
                        </button>
                        <span className="w-8 text-center text-[9px] tabular-nums text-gray-400">
                          {Math.round((nameScales[e.userId] ?? 1) * 100)}%
                        </span>
                        <button
                          type="button"
                          onClick={() => bumpNameScale(e.userId, 0.1)}
                          className="h-5 w-5 rounded border text-[11px] leading-none text-gray-600 hover:bg-gray-100"
                        >
                          A+
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            )}
          </div>
          )}

          {/* ── Page sheet preview (center) ──────────────────────────── */}
          <div className="flex flex-col items-center gap-2 lg:sticky lg:top-4 lg:self-start">
            {(() => {
              const rearSide = tpl.sameBothSides ? tpl.front : tpl.rear;
              const hasRear = !!rearSide?.image;
              const showRear = previewSide === "rear" && hasRear;
              const sideData = showRear ? rearSide : tpl.front;
              return (
                <>
                  {fit && (
                    <>
                      {/* interactive stage — controls overlaid so the sheet uses all the space */}
                      <div
                        ref={stageRef}
                        onPointerDown={onPanDown}
                        onPointerMove={onPanMove}
                        onPointerUp={onPanUp}
                        onPointerLeave={onPanUp}
                        onDoubleClick={doFit}
                        onDragStart={(e) => e.preventDefault()}
                        className="relative w-full overflow-hidden rounded border bg-gray-100/70 cursor-grab active:cursor-grabbing select-none"
                        style={{ height: "calc(100vh - 7.5rem)", touchAction: "none" }}
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
                            className="relative bg-white shadow-md ring-1 ring-gray-200"
                            style={{ width: fit.dispW, height: fit.dispH }}
                          >
                            {/* printable area (margin) guide */}
                            <div
                              className="absolute border border-dashed border-indigo-200 pointer-events-none"
                              style={{
                                left: marginMm * fit.pxPerMM,
                                top: marginMm * fit.pxPerMM,
                                right: marginMm * fit.pxPerMM,
                                bottom: marginMm * fit.pxPerMM,
                              }}
                            />
                            {(selectedEmployees.length > 0
                              ? selectedEmployees.slice(0, fit.perPage)
                              : Array.from(
                                  { length: fit.perPage },
                                  () => undefined,
                                )
                            ).map((emp, i) => {
                              const row = Math.floor(i / fit.cols);
                              const col = i % fit.cols;
                              // rear mirrors the duplex-flip axis (back-to-back)
                              const pc =
                                showRear && flip === "long"
                                  ? fit.cols - 1 - col
                                  : col;
                              const pr =
                                showRear && flip === "short"
                                  ? fit.rows - 1 - row
                                  : row;
                              const left =
                                (fit.startX + pc * (fit.cw + gapMm)) *
                                fit.pxPerMM;
                              const top =
                                (fit.startY + pr * (fit.ch + gapMm)) *
                                fit.pxPerMM;
                              return renderCard(
                                sideData,
                                emp,
                                i,
                                left,
                                top,
                                fit.cw * fit.pxPerMM,
                                fit.ch * fit.pxPerMM,
                              );
                            })}
                          </div>
                        </div>

                        {/* Front / Rear switch — overlay */}
                        <div
                          onPointerDown={(e) => e.stopPropagation()}
                          className="absolute top-2 left-2 inline-flex rounded-md border bg-white/90 p-0.5 shadow-sm"
                        >
                          {(["front", "rear"] as const).map((s) => {
                            const disabled = s === "rear" && !hasRear;
                            const active = (showRear ? "rear" : "front") === s;
                            return (
                              <button
                                key={s}
                                type="button"
                                disabled={disabled}
                                onClick={() => setPreviewSide(s)}
                                className={
                                  "px-3 h-6 rounded text-[11px] font-medium capitalize transition " +
                                  (disabled
                                    ? "text-gray-300 cursor-not-allowed"
                                    : active
                                      ? "bg-indigo-600 text-white shadow-sm"
                                      : "text-gray-600 hover:bg-gray-100")
                                }
                              >
                                {s}
                              </button>
                            );
                          })}
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
                            className="w-28 accent-indigo-600 cursor-pointer"
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

                        {/* caption + hint — bottom overlay */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
                          <span className="inline-block rounded bg-white/85 px-2 py-0.5 text-[10px] text-gray-600 shadow-sm whitespace-nowrap">
                            {showRear ? "Rear" : "Front"} · {paperSize} ·{" "}
                            {orientation} ·{" "}
                            {selected.size === 0
                              ? `${fit.cols}×${fit.rows} · select employees`
                              : `${Math.min(fit.perPage, selectedEmployees.length)} of ${selected.size} ID${selected.size === 1 ? "" : "s"} · page 1/${fit.pages}`}
                            {" · scroll-zoom · drag-pan · dbl-click fit"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>

          {/* ── Settings ─────────────────────────────────────────────── */}
          <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
            {/* Paper */}
            <div className="border rounded-lg bg-white p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  Paper &amp; layout
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-[10px]"
                  title="Smallest printer-safe margin (8mm) + no gap — fits the most IDs without the printer shrinking the sheet"
                  onClick={() => {
                    setMarginMm(8);
                    setGapMm(0);
                  }}
                >
                  Max fit
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Paper size</Label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="h-7 text-xs w-full border rounded-md px-1.5 bg-white"
                  >
                    {Object.keys(PAPER_MM).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Orientation</Label>
                  <select
                    value={orientation}
                    onChange={(e) =>
                      setOrientation(e.target.value as "portrait" | "landscape")
                    }
                    className="h-7 text-xs w-full border rounded-md px-1.5 bg-white"
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Margin (mm)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={40}
                    value={marginMm}
                    onChange={(e) =>
                      // floor at 5mm — below the printer's non-printable border
                      // it auto-shrinks the whole sheet (cards print too small)
                      setMarginMm(Math.max(5, Number(e.target.value) || 5))
                    }
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Gap (mm)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={gapMm}
                    onChange={(e) =>
                      setGapMm(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Duplex flip (for back-to-back)</Label>
                <select
                  value={flip}
                  onChange={(e) => setFlip(e.target.value as "long" | "short")}
                  className="h-7 text-xs w-full border rounded-md px-1.5 bg-white"
                >
                  <option value="long">Flip on long edge</option>
                  <option value="short">Flip on short edge</option>
                </select>
                <p className="text-[9px] text-gray-400">
                  Match your printer's 2-sided setting so rears align behind
                  fronts.
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cutMarks}
                  onChange={(e) => setCutMarks(e.target.checked)}
                  className="h-3.5 w-3.5 accent-indigo-600"
                />
                Cut guides (card outlines)
              </label>
              <p className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 leading-snug">
                {marginMm < 8 && (
                  <>
                    <b>Margin under 8mm</b> can make the printer shrink the whole
                    sheet (cards print too small). Use ≥ 8mm.{" "}
                  </>
                )}
                Print at <b>100% / Actual size</b> (turn OFF "Fit to page"), and
                pick the paper size that's actually loaded. Measure a cut guide
                or the 100mm ruler — a card should equal {tpl.size.w} ×{" "}
                {tpl.size.h} {tpl.size.unit}.
              </p>
            </div>

            {/* Missing-photo warning — template requires an uploaded picture */}
            {templateNeedsPhoto && missingPhoto.length > 0 && (
              <div className="border border-red-300 bg-red-50 rounded-lg p-3 text-[11px] text-red-700">
                <p className="font-semibold flex items-center gap-1.5">
                  <ImageOff className="h-3.5 w-3.5" />
                  {missingPhoto.length} selected employee
                  {missingPhoto.length === 1 ? "" : "s"} have no uploaded photo
                </p>
                <p className="mt-1 text-red-600">
                  This template has a Photo placeholder. Export is blocked until
                  they have a picture or are deselected:
                </p>
                <ul className="mt-1 max-h-24 overflow-auto list-disc pl-4 space-y-0.5">
                  {missingPhoto.slice(0, 30).map((e) => (
                    <li key={e.userId}>{e.fullName}</li>
                  ))}
                  {missingPhoto.length > 30 && (
                    <li>…and {missingPhoto.length - 30} more</li>
                  )}
                </ul>
              </div>
            )}

            {/* Fit summary */}
            {fit && (
              <div className="border rounded-lg bg-white p-3">
                <p className="text-[11px] text-gray-600">
                  <span className="font-semibold text-gray-900">
                    {fit.cols} × {fit.rows} = {fit.perPage}
                  </span>{" "}
                  IDs per page
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {selected.size} selected →{" "}
                  <span className="font-semibold text-gray-900">
                    {fit.pages}
                  </span>{" "}
                  page{fit.pages === 1 ? "" : "s"}
                  {tpl.sameBothSides || tpl.rear.image
                    ? " · 2 files (front + rear)"
                    : " · 1 file (front)"}
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Card {tpl.size.w} × {tpl.size.h} {tpl.size.unit} · prints at
                  actual size
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdCardBatch;
