import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import SearchUser from "@/layout/SearchUser";
import { getUserVerifyInfo, verifyIdCode } from "@/db/statement";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  IdCard,
  ArrowLeft,
  Printer,
  Loader2,
  PanelsTopLeft,
  ShieldCheck,
  Users,
  ImageOff,
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
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Width (px) of the maker's editor card — placeholder font/QR/photo px are
// authored against this, so previews and print scale relative to it.
const DESIGN_W = 460;

const FONT_CSS: Record<string, string> = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "'Times New Roman', Times, serif",
  mono: "'Courier New', Courier, monospace",
};
const fontCss = (key?: string) => FONT_CSS[key || "sans"] || FONT_CSS.sans;

// Text outline as a multi-direction text-shadow (prints reliably, unlike
// -webkit-text-stroke which print engines often drop).
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

const IdCardIssue = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const frontRef = useRef<HTMLDivElement>(null);
  const storageKey = `idcard_tpl_${lineId ?? "default"}`;

  const [tpl, setTpl] = useState<Template | null>(null);
  const [pickedUserId, setPickedUserId] = useState("");
  const [values, setValues] = useState({
    fullName: "",
    position: "",
    office: "",
  });
  const [extras, setExtras] = useState<{
    birthday: string;
    age: string;
    sex: string;
    phone: string;
    civilStatus: string;
    bloodType: string;
    address: string;
  } | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [loadingPerson, setLoadingPerson] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const p = JSON.parse(raw);
      let t: Template | null = null;
      if (p.size?.w && (p.front?.image || p.rear?.image)) {
        // two-sided format
        t = {
          size: p.size,
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
        // legacy single-sided
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

  const toPx = (val: number, unit: "mm" | "in") =>
    unit === "mm" ? (val / 25.4) * 96 : val * 96;

  const onPickEmployee = async (userId: string) => {
    setPickedUserId(userId);
    if (!userId) {
      setValues({ fullName: "", position: "", office: "" });
      setExtras(null);
      setQrDataUrl(null);
      setPhotoUrl(null);
      setVerifyUrl(null);
      return;
    }
    setLoadingPerson(true);
    try {
      const info = await getUserVerifyInfo(auth.token as string, userId);
      setQrDataUrl(info.qr);
      setVerifyUrl(info.verifyUrl);
      setExtras(info.extras ?? null);
      const v = await verifyIdCode(info.code);
      setValues({
        fullName: v.fullName ?? "",
        position: v.position ?? "",
        office: v.department ?? "",
      });
      setPhotoUrl(v.photoUrl ?? null);
    } catch {
      toast.error("Couldn't load that employee.");
    } finally {
      setLoadingPerson(false);
    }
  };

  const textValue = (field: Field): string => {
    switch (field) {
      case "fullName":
        return values.fullName;
      case "position":
        return values.position;
      case "office":
        return values.office;
      case "address":
        return extras?.address ?? "";
      case "birthday":
        return extras?.birthday ?? "";
      case "phone":
        return extras?.phone ?? "";
      case "age":
        return extras?.age ?? "";
      case "civilStatus":
        return extras?.civilStatus ?? "";
      case "sex":
        return extras?.sex ?? "";
      case "bloodType":
        return extras?.bloodType ?? "";
      default:
        return "";
    }
  };

  const buildPlaceholderHtml = (list: Placeholder[], scale: number) =>
    list
      .map((p) => {
        if (p.field === "qr") {
          if (!qrDataUrl) return "";
          const w = (p.size || 70) * scale;
          return `<img src="${qrDataUrl}" style="position:absolute;left:${p.xPct}%;top:${p.yPct}%;transform:translate(-50%,-50%);width:${w}px;height:${w}px"/>`;
        }
        if (p.field === "photo") {
          if (!photoUrl) return "";
          const w = (p.size || 90) * scale;
          const h = (p.height || 110) * scale;
          return `<img src="${photoUrl}" style="position:absolute;left:${p.xPct}%;top:${p.yPct}%;transform:translate(-50%,-50%);width:${w}px;height:${h}px;object-fit:cover"/>`;
        }
        const text = textValue(p.field).trim();
        if (!text) return "";
        const stroke =
          p.strokeWidth && p.strokeWidth > 0
            ? `text-shadow:${outlineShadow(p.strokeWidth * scale, p.strokeColor || "#ffffff")};`
            : "";
        return `<div style="position:absolute;left:${p.xPct}%;top:${p.yPct}%;transform:translate(-50%,-50%);font-size:${(p.fontSize * scale).toFixed(1)}px;color:${p.color};font-weight:${p.bold ? 700 : 400};text-align:${p.align};white-space:nowrap;font-family:${fontCss(p.fontFamily)};${stroke}">${escapeHtml(text)}</div>`;
      })
      .join("");

  const needsPhoto =
    !!tpl &&
    [...tpl.front.placeholders, ...tpl.rear.placeholders].some(
      (p) => p.field === "photo",
    );

  const handlePrint = () => {
    if (!tpl) return;
    if (!pickedUserId) {
      toast.error("Pick an employee first.");
      return;
    }
    if (needsPhoto && !photoUrl) {
      toast.error(
        "This template requires a photo, but this employee has no uploaded picture.",
      );
      return;
    }
    const printWidthPx = toPx(tpl.size.w, tpl.size.unit);
    const scale = printWidthPx / DESIGN_W;
    const cardW = `${tpl.size.w}${tpl.size.unit}`;
    const cardH = `${tpl.size.h}${tpl.size.unit}`;

    const faceHtml = (s: SideData) =>
      s.image
        ? `<div class="card"><img class="bg" src="${s.image}"/>${buildPlaceholderHtml(s.placeholders, scale)}</div>`
        : "";
    const pages = [faceHtml(tpl.front), faceHtml(tpl.rear)]
      .filter(Boolean)
      .join("");

    const w = window.open("", "_blank", "width=720,height=520");
    if (!w) {
      toast.error("Pop-up blocked — allow pop-ups to print.");
      return;
    }
    w.document.write(
      `<!doctype html><html><head><title>ID Card</title><style>*{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}@page{margin:6mm}body{margin:0}.card{position:relative;display:block;width:${cardW};height:${cardH};margin:0 auto;page-break-after:always}.card:last-child{page-break-after:auto}.card img.bg{display:block;width:${cardW};height:${cardH};object-fit:fill}</style></head><body onload="setTimeout(function(){window.print()},250)">${pages}</body></html>`,
    );
    w.document.close();
  };

  // ── No template yet ──────────────────────────────────────────────────────
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
          <h1 className="text-sm font-semibold text-gray-900">Issue IDs</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <PanelsTopLeft className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-gray-700">
              No saved template
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              Design and save an ID template first, then come back here to issue
              cards for real employees.
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

  const aspect = tpl.size.h > 0 ? tpl.size.w / tpl.size.h : 1.586;
  // Size the preview large enough to read, fitting either orientation on screen.
  const PREVIEW_MAX_W = 380;
  const PREVIEW_MAX_H = 500;
  const dispW =
    aspect >= 1 ? PREVIEW_MAX_W : Math.round(PREVIEW_MAX_H * aspect);
  const dispH =
    aspect >= 1 ? Math.round(PREVIEW_MAX_W / aspect) : PREVIEW_MAX_H;
  // placeholder px are authored at DESIGN_W → scale them to the preview size
  const previewScale = dispW / DESIGN_W;

  const renderFace = (
    s: SideData,
    label: string,
    ref?: React.Ref<HTMLDivElement>,
  ) => (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <div
        ref={ref}
        className="relative rounded-lg overflow-hidden shadow-sm border bg-white"
        style={{ width: dispW, height: dispH }}
      >
        {s.image && (
          <img
            src={s.image}
            alt={label}
            className="absolute inset-0 w-full h-full object-fill"
            draggable={false}
          />
        )}
        {s.placeholders.map((p) => {
          if (p.field === "qr" || p.field === "photo") {
            const isQr = p.field === "qr";
            const baseW = p.size || (isQr ? 70 : 90);
            const baseH = isQr ? baseW : p.height || 110;
            const w = baseW * previewScale;
            const h = baseH * previewScale;
            const src = isQr ? qrDataUrl : photoUrl;
            return (
              <div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.xPct}%`,
                  top: `${p.yPct}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt={isQr ? "QR" : "Photo"}
                    style={{
                      width: w,
                      height: h,
                      objectFit: isQr ? undefined : "cover",
                    }}
                  />
                ) : (
                  <div
                    className="border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400"
                    style={{ width: w, height: h }}
                  >
                    {isQr ? "QR" : "PHOTO"}
                  </div>
                )}
              </div>
            );
          }
          const text = textValue(p.field).trim();
          return (
            <div
              key={p.id}
              className="absolute whitespace-nowrap px-0.5"
              style={{
                left: `${p.xPct}%`,
                top: `${p.yPct}%`,
                transform: "translate(-50%, -50%)",
                fontSize: p.fontSize * previewScale,
                color: text ? p.color : "#9ca3af",
                fontWeight: p.bold ? 700 : 400,
                textAlign: p.align,
                fontFamily: fontCss(p.fontFamily),
                textShadow:
                  text && p.strokeWidth && p.strokeWidth > 0
                    ? outlineShadow(
                        p.strokeWidth * previewScale,
                        p.strokeColor || "#ffffff",
                      )
                    : undefined,
              }}
            >
              {text || `{${FIELD_LABEL[p.field]}}`}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
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
            Issue &amp; Verify IDs
          </h1>
          <p className="text-[11px] text-gray-500 leading-none mt-0.5">
            Pick an employee — the saved template fills with their details + QR.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => nav("../tools/id-card")}
        >
          Edit template
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => nav("../tools/id-card/batch")}
        >
          <Users className="h-3.5 w-3.5" />
          Bulk export
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700"
          disabled={!!pickedUserId && needsPhoto && !photoUrl}
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" />
          Print
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
          {/* Filled card preview(s) */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex flex-wrap items-start justify-center gap-4">
              {renderFace(tpl.front, "Front", frontRef)}
              {tpl.rear.image && renderFace(tpl.rear, "Rear")}
            </div>
            <p className="text-[10px] text-gray-400">
              {tpl.size.w} × {tpl.size.h} {tpl.size.unit} · prints at actual size
              {tpl.rear.image ? " · front & rear" : ""}
            </p>
          </div>

          {/* Employee + verify */}
          <div className="space-y-3">
            <div className="border rounded-lg bg-white p-3 space-y-2">
              <Label className="text-[10px] flex items-center gap-1">
                Employee
                {loadingPerson && (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                )}
              </Label>
              <SearchUser
                lineId={lineId as string}
                token={auth.token as string}
                onChange={onPickEmployee}
                value={pickedUserId}
              />
              <p className="text-[9px] text-gray-400">
                Plantilla or non-plantilla. Fills name, position &amp; their
                verification QR.
              </p>
              {values.fullName && (
                <div className="text-[11px] text-gray-700 border-t pt-2 mt-1">
                  <p className="font-medium">{values.fullName}</p>
                  {values.position && (
                    <p className="text-gray-500">{values.position}</p>
                  )}
                </div>
              )}
              {pickedUserId && needsPhoto && !photoUrl && (
                <div className="flex items-start gap-1.5 text-[10px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
                  <ImageOff className="h-3.5 w-3.5 flex-none mt-px" />
                  <span>
                    This template requires a photo, but this employee has no
                    uploaded picture. Printing is blocked until one is added.
                  </span>
                </div>
              )}
            </div>

            {verifyUrl && (
              <div className="border rounded-lg bg-white p-3 space-y-2">
                <h4 className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verify
                </h4>
                <p className="text-[10px] text-gray-500">
                  The card's QR opens this page — confirming the holder against
                  the live record.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] w-full"
                  onClick={() => window.open(verifyUrl, "_blank")}
                >
                  Open verify page
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdCardIssue;
