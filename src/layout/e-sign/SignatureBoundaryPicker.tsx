import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Wand2, Maximize } from "lucide-react";

import { measureInk, FULL_INK, type InkBox } from "@/utils/signatureInk";

/**
 * Draw the boundary of the ACTUAL signature inside an uploaded file.
 *
 * The whole file is kept and the whole file still prints — the tail that
 * sweeps down and left past everything is part of the signature and must
 * stay. What the boundary says is which part is the writing: the bit that
 * has to come out a chosen size, be centred in the box on the page, and sit
 * ON the line. Everything outside it is allowed to hang past.
 *
 * So the boundary's BOTTOM EDGE is the writing line. Put it along the stroke
 * the hand rested on and the tail falls below the printed name by itself,
 * which is the whole point.
 *
 * Green is the file, red is the signature — the same two rectangles from the
 * document this was specified in.
 */

const HANDLE = 9;

type Corner = "nw" | "ne" | "sw" | "se";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const SignatureBoundaryPicker = ({
  src,
  value,
  onChange,
}: {
  /** Anything an <img> can load: object URL, data URL, or a path. */
  src: string;
  value: InkBox | null;
  onChange: (box: InkBox) => void;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [ratio, setRatio] = useState(2.2);
  const [hint, setHint] = useState<string | null>(null);
  /** The pointer currently drawing or dragging, if any. */
  const gesture = useRef<number | null>(null);

  const box = value ?? FULL_INK;

  /** Fractions of the image from a pointer event. */
  const at = useCallback((e: PointerEvent | React.PointerEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return null;
    const r = wrap.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - r.left) / r.width),
      y: clamp01((e.clientY - r.top) / r.height),
    };
  }, []);

  /**
   * One gesture, owning its pointer from start to release.
   *
   * Window listeners keyed to the pointer id, torn down on release wherever
   * that lands. The placement editors used to commit from the element's own
   * pointerup and leaked half-finished rectangles into the next drag when it
   * never arrived; there is no reason to repeat that here.
   */
  const runGesture = useCallback(
    (
      e: React.PointerEvent,
      onMove: (p: { x: number; y: number }) => void,
      onDone?: () => void,
    ) => {
      if (gesture.current !== null) return;
      e.preventDefault();
      e.stopPropagation();
      gesture.current = e.pointerId;
      const move = (ev: PointerEvent) => {
        if (ev.pointerId !== gesture.current) return;
        const p = at(ev);
        if (p) onMove(p);
      };
      const up = (ev: PointerEvent) => {
        if (ev.pointerId !== gesture.current) return;
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        gesture.current = null;
        onDone?.();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    },
    [at],
  );

  /** Drag on empty space draws a fresh boundary. */
  const startDraw = (e: React.PointerEvent) => {
    const origin = at(e);
    if (!origin) return;
    let moved = false;
    runGesture(
      e,
      (p) => {
        moved = true;
        onChange({
          x0: Math.min(origin.x, p.x),
          y0: Math.min(origin.y, p.y),
          x1: Math.max(origin.x, p.x),
          y1: Math.max(origin.y, p.y),
        });
      },
      () => {
        // A click with no drag is almost always a misclick, not a request to
        // throw away the boundary, so leave it alone.
        if (!moved) setHint("Drag a box around the writing.");
      },
    );
  };

  const startMoveBox = (e: React.PointerEvent) => {
    const start = at(e);
    if (!start) return;
    const from = { ...box };
    runGesture(e, (p) => {
      const dx = p.x - start.x;
      const dy = p.y - start.y;
      const w = from.x1 - from.x0;
      const h = from.y1 - from.y0;
      const x0 = clamp01(Math.min(from.x0 + dx, 1 - w));
      const y0 = clamp01(Math.min(from.y0 + dy, 1 - h));
      onChange({ x0, y0, x1: x0 + w, y1: y0 + h });
    });
  };

  const startResize = (e: React.PointerEvent, corner: Corner) => {
    const from = { ...box };
    runGesture(e, (p) => {
      const next = { ...from };
      if (corner === "nw" || corner === "sw") next.x0 = p.x;
      else next.x1 = p.x;
      if (corner === "nw" || corner === "ne") next.y0 = p.y;
      else next.y1 = p.y;
      onChange({
        x0: Math.min(next.x0, next.x1),
        y0: Math.min(next.y0, next.y1),
        x1: Math.max(next.x0, next.x1),
        y1: Math.max(next.y0, next.y1),
      });
    });
  };

  // A boundary with no area cannot be sized or centred, so refuse to leave
  // one behind when the drag ends on top of where it started.
  useEffect(() => {
    if (!value) return;
    if (value.x1 - value.x0 < 0.02 || value.y1 - value.y0 < 0.02) {
      setHint("That boundary is too small — using the whole image instead.");
      onChange(FULL_INK);
    }
  }, [value, onChange]);

  const pct = (n: number) => `${n * 100}%`;
  const corners: { c: Corner; style: React.CSSProperties }[] = [
    { c: "nw", style: { left: pct(box.x0), top: pct(box.y0), cursor: "nwse-resize" } },
    { c: "ne", style: { left: pct(box.x1), top: pct(box.y0), cursor: "nesw-resize" } },
    { c: "sw", style: { left: pct(box.x0), top: pct(box.y1), cursor: "nesw-resize" } },
    { c: "se", style: { left: pct(box.x1), top: pct(box.y1), cursor: "nwse-resize" } },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] text-gray-500 uppercase tracking-wide">
          Signature boundary
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-1.5 text-[10px] gap-1"
            onClick={() => {
              const el = imgRef.current;
              if (!el) return;
              onChange(measureInk(el));
              setHint(null);
            }}
            title="Guess it from where the ink is"
          >
            <Wand2 className="h-3 w-3" />
            Auto
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-1.5 text-[10px] gap-1"
            onClick={() => {
              onChange(FULL_INK);
              setHint(null);
            }}
            title="Treat the whole image as the signature"
          >
            <Maximize className="h-3 w-3" />
            Whole image
          </Button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full select-none overflow-hidden rounded-md border-2 border-dashed border-emerald-500 bg-white"
        style={{ aspectRatio: String(ratio), touchAction: "none", cursor: "crosshair" }}
        onPointerDown={startDraw}
      >
        <img
          ref={imgRef}
          src={src}
          alt="Uploaded signature"
          draggable={false}
          onLoad={(e) => {
            const el = e.currentTarget;
            if (el.naturalWidth && el.naturalHeight) {
              setRatio(el.naturalWidth / el.naturalHeight);
            }
            // First look at this file: offer a guess rather than a blank box.
            if (!value) {
              try {
                onChange(measureInk(el));
              } catch {
                onChange(FULL_INK);
              }
            }
          }}
          className="absolute inset-0 h-full w-full object-fill pointer-events-none"
        />

        {/* dim everything outside the boundary so the writing stands out */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "rgba(255,255,255,0.55)",
            clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${pct(box.x0)} ${pct(box.y0)}, ${pct(box.x0)} ${pct(box.y1)}, ${pct(box.x1)} ${pct(box.y1)}, ${pct(box.x1)} ${pct(box.y0)}, ${pct(box.x0)} ${pct(box.y0)})`,
          }}
        />

        {/* the boundary itself */}
        <div
          className="absolute border-2 border-dashed border-red-500"
          style={{
            left: pct(box.x0),
            top: pct(box.y0),
            width: pct(box.x1 - box.x0),
            height: pct(box.y1 - box.y0),
            cursor: "move",
          }}
          onPointerDown={startMoveBox}
        >
          {/* the bottom edge IS the writing line, so label it */}
          <span className="absolute -bottom-[1px] left-0 right-0 border-b-2 border-red-500" />
          <span className="absolute -bottom-4 right-0 text-[9px] font-medium text-red-600 whitespace-nowrap">
            writing line
          </span>
        </div>

        {corners.map(({ c, style }) => (
          <span
            key={c}
            onPointerDown={(e) => startResize(e, c)}
            className="absolute rounded-sm border border-red-600 bg-white"
            style={{
              ...style,
              width: HANDLE,
              height: HANDLE,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      <p className="text-[10px] text-gray-500 leading-snug">
        Green is the whole file, which is kept and still prints. Drag the red
        box around the actual writing &mdash; its bottom edge is the line the
        signature sits on, so leave the long tail outside it.
      </p>
      {hint ? <p className="text-[10px] text-amber-600">{hint}</p> : null}
    </div>
  );
};

export default SignatureBoundaryPicker;
