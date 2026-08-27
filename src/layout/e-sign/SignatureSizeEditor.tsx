import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/custom/Modal";
import { Loader2, RotateCcw } from "lucide-react";

import type { UserSignatureItem } from "@/db/statements/document";
import {
  measureInk,
  placeSignature,
  FULL_INK,
  type InkBox,
} from "@/utils/signatureInk";
import SignatureBoundaryPicker from "./SignatureBoundaryPicker";

/**
 * How big a signature prints, and where its writing line is.
 *
 * A signature used to be squeezed into whatever box someone dragged on the
 * page and centred there. On a real signature — mostly empty space, the
 * writing in the middle, a long tail sweeping down — that put the mark near
 * the top of the box with the tail running through the printed name below.
 *
 * So the size stops coming from the box. The owner sets it once, here, and
 * says where the writing line sits; the stamp then puts that line on the
 * bottom edge of the box, like a pen would, and lets the tail hang past it.
 *
 * The preview draws the box as a dashed outline because that box is only the
 * target area — the signature is deliberately allowed to overflow it.
 */

/** A sensible first guess, in points, for someone who has never set one. */
const DEFAULT_HEIGHT_PT = 24;
const MIN_PT = 4;
const MAX_PT = 288;

/** The preview's stand-in page, in points: a signature box on a form. */
const BOX = { x: 40, y: 26, width: 200, height: 34 };
const CANVAS = { width: 280, height: 118 };

const SignatureSizeEditor = ({
  sig,
  open,
  onClose,
  onSave,
  saving,
}: {
  sig: UserSignatureItem;
  open: boolean;
  onClose: () => void;
  onSave: (v: {
    inkHeightPt: number | null;
    baselinePct: number;
    ink: InkBox | null;
  }) => void;
  saving: boolean;
}) => {
  const [height, setHeight] = useState<number>(
    sig.inkHeightPt ?? DEFAULT_HEIGHT_PT,
  );
  /** Off means "fit the boundary to whatever box is drawn on the page",
   *  which is the sane default — the boundary already says how big the
   *  writing is relative to itself. A fixed height is for someone who
   *  wants the same millimetres on every document. */
  const [useFixed, setUseFixed] = useState<boolean>(sig.inkHeightPt != null);
  const [baseline, setBaseline] = useState<number>(sig.baselinePct ?? 100);
  const [ink, setInk] = useState<InkBox | null>(sig.ink ?? null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Re-seed whenever a different signature is opened.
  useEffect(() => {
    if (!open) return;
    setHeight(sig.inkHeightPt ?? DEFAULT_HEIGHT_PT);
    setUseFixed(sig.inkHeightPt != null);
    setBaseline(sig.baselinePct ?? 100);
    setInk(sig.ink ?? null);
  }, [open, sig.id, sig.inkHeightPt, sig.baselinePct, sig.ink]);

  /** Older signatures were stored before anything measured their ink, so
   *  measure it here the first time one of them is opened. */
  const onImgLoad = () => {
    const el = imgRef.current;
    if (!el) return;
    setNatural({ w: el.naturalWidth, h: el.naturalHeight });
    if (!ink) {
      try {
        setInk(measureInk(el));
      } catch {
        /* a tainted canvas just means we keep using the whole file */
      }
    }
  };

  const rect = useMemo(
    () =>
      placeSignature(BOX, natural?.w ?? 3, natural?.h ?? 1, {
        inkHeightPt: useFixed ? height : null,
        baselinePct: baseline,
        ink,
      }),
    [useFixed, height, baseline, ink, natural],
  );

  return (
    <Modal
      title={`Stamp size — ${sig.title}`}
      onOpen={open}
      setOnOpen={onClose}
      className="sm:max-w-lg"
      footer={1}
    >
      <div className="space-y-3">
        {/* ── Preview ──────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">
            How it will stamp
          </p>
          <div
            className="relative w-full rounded-md border bg-white overflow-hidden"
            style={{ aspectRatio: `${CANVAS.width} / ${CANVAS.height}` }}
          >
            <div
              className="absolute inset-0"
              style={{
                // One shared coordinate space with the numbers above, so the
                // preview scales with the card without changing the maths.
                containerType: "inline-size",
              }}
            >
              <svg
                viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
                className="absolute inset-0 h-full w-full"
              >
                {/* the target area someone dragged on the page */}
                <rect
                  x={BOX.x}
                  y={BOX.y}
                  width={BOX.width}
                  height={BOX.height}
                  fill="none"
                  stroke="#f87171"
                  strokeWidth={0.8}
                  strokeDasharray="3 2"
                />
                {/* the line the signature is written on */}
                <line
                  x1={BOX.x}
                  y1={BOX.y + BOX.height}
                  x2={BOX.x + BOX.width}
                  y2={BOX.y + BOX.height}
                  stroke="#94a3b8"
                  strokeWidth={0.6}
                />
                <text
                  x={BOX.x + BOX.width / 2}
                  y={BOX.y + BOX.height + 9}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#475569"
                >
                  JUAN DELA CRUZ
                </text>
                <text
                  x={BOX.x + BOX.width / 2}
                  y={BOX.y + BOX.height + 17}
                  textAnchor="middle"
                  fontSize="5"
                  fill="#94a3b8"
                >
                  Municipal Administrator
                </text>
                {sig.preview && (
                  <image
                    href={sig.preview}
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    preserveAspectRatio="none"
                  />
                )}
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 leading-snug">
            The dashed box is the target area only. The signature is meant to
            overflow it &mdash; what matters is that the writing sits on the
            line and the tail hangs below.
          </p>
        </div>

        {/* Hidden loader: gives us the file's real pixel size and lets us
            measure the ink of signatures uploaded before this existed. */}
        {sig.preview && (
          <img
            ref={imgRef}
            src={sig.preview}
            alt=""
            onLoad={onImgLoad}
            className="hidden"
          />
        )}

        {/* ── Boundary ─────────────────────────────────────────────── */}
        {sig.preview ? (
          <SignatureBoundaryPicker
            src={sig.preview}
            value={ink}
            onChange={setInk}
          />
        ) : null}

        {/* ── Size ─────────────────────────────────────────────────── */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useFixed}
            onChange={(e) => setUseFixed(e.target.checked)}
            className="accent-blue-600"
          />
          <span className="text-[10px] font-semibold text-gray-700">
            Use a fixed height
          </span>
          <span className="text-[10px] text-gray-500">
            {useFixed
              ? "the same size on every document"
              : "off — the boundary fills the box drawn on the page"}
          </span>
        </label>

        <div
          className={`grid grid-cols-[1fr_auto] gap-2 items-end ${
            useFixed ? "" : "opacity-40 pointer-events-none"
          }`}
        >
          <div>
            <label className="text-[10px] font-semibold text-gray-700">
              Signature height
            </label>
            <input
              type="range"
              min={MIN_PT}
              max={96}
              step={1}
              value={Math.min(96, height)}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
          <div className="w-24">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={MIN_PT}
                max={MAX_PT}
                value={height}
                onChange={(e) =>
                  setHeight(
                    Math.min(MAX_PT, Math.max(MIN_PT, Number(e.target.value) || MIN_PT)),
                  )
                }
                className="h-7 text-[11px]"
              />
              <span className="text-[10px] text-gray-500">pt</span>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 -mt-1">
          How tall the writing itself prints, ignoring the empty space around
          it. Roughly the size of text at the same point size.
        </p>

        {/* ── Writing line ─────────────────────────────────────────── */}
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <label className="text-[10px] font-semibold text-gray-700">
              Writing line
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={baseline}
              onChange={(e) => setBaseline(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
          <div className="w-24 flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={100}
              value={baseline}
              onChange={(e) =>
                setBaseline(
                  Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                )
              }
              className="h-7 text-[11px]"
            />
            <span className="text-[10px] text-gray-500">%</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 -mt-1">
          Where the pen would have rested. Drag it up until only the tail is
          left hanging below the line. 100% puts the whole mark above it.
        </p>

        <div className="flex items-center gap-1.5 pt-1">
          <Button
            size="sm"
            className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
            disabled={saving}
            onClick={() =>
              onSave({
                inkHeightPt: useFixed ? height : null,
                baselinePct: baseline,
                ink,
              })
            }
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            Save size
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[10px] gap-1.5"
            disabled={saving}
            onClick={() =>
              onSave({ inkHeightPt: null, baselinePct: 100, ink: FULL_INK })
            }
            title="Forget the boundary and the size: squeeze the whole file into whatever box was drawn on the page, the way it worked before"
          >
            <RotateCcw className="h-3 w-3" />
            Fit to box instead
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SignatureSizeEditor;
