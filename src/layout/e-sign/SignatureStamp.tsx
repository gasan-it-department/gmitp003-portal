import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { placeSignature, type InkBox } from "@/utils/signatureInk";

/**
 * The signature drawn inside a placement box, the way the PDF draws it.
 *
 * The on-screen preview used to be `<img className="w-full h-full
 * object-contain">` — the whole file squeezed into the box and centred,
 * which is the rule the stamp itself stopped using. So a document looked one
 * way while being signed and another way once downloaded, and the downloaded
 * one was the correct one.
 *
 * The placement is computed in the box's real PIXELS, not in percentages.
 * Percentages look like a square to the arithmetic — 100 wide by 100 tall —
 * so fitting a boundary by aspect ratio inside them lands the writing in the
 * wrong place and the wrong size on any box that is not actually square.
 * That is a mistake worth naming, because everything here is otherwise
 * expressed as percentages of the page.
 *
 * The rect can fall outside the box, which is the point: the tail hangs past
 * it exactly as it does on the page. Nothing rendering this may clip.
 */
export interface SignaturePlacement {
  inkHeightPt?: number | null;
  baselinePct?: number | null;
  ink?: InkBox | null;
}

const SignatureStamp = ({
  src,
  placement,
  alt = "signature",
}: {
  src: string;
  placement?: SignaturePlacement | null;
  alt?: string;
}) => {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);

  // The box is a percentage of a PDF page that is itself being scaled, so it
  // changes size on zoom and on window resize. Watch it rather than reading
  // it once.
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setBox({ w: r.width, h: r.height });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Some browsers report a cached image as loaded before onLoad can attach.
  useEffect(() => {
    setNatural(null);
  }, [src]);

  const rect =
    box && natural
      ? placeSignature({ x: 0, y: 0, width: box.w, height: box.h }, natural.w, natural.h, {
          inkHeightPt: placement?.inkHeightPt ?? null,
          baselinePct: placement?.baselinePct ?? null,
          ink: placement?.ink ?? null,
        })
      : null;

  return (
    <span
      ref={hostRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        onLoad={(e) => {
          const el = e.currentTarget;
          if (el.naturalWidth && el.naturalHeight) {
            setNatural({ w: el.naturalWidth, h: el.naturalHeight });
          }
        }}
        style={
          rect
            ? {
                position: "absolute",
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                // The rect already carries the true aspect ratio; letting the
                // browser fit it again would undo the placement.
                objectFit: "fill",
              }
            : { opacity: 0, position: "absolute", inset: 0 }
        }
      />
    </span>
  );
};

export default SignatureStamp;
