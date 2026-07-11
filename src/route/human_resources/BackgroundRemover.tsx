import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Upload,
  Download,
  Loader2,
  RefreshCcw,
  Wand2,
  ImageIcon,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  X,
  Maximize2,
} from "lucide-react";

// Checkerboard so transparency is visible on the result.
const CHECKER: React.CSSProperties = {
  backgroundColor: "#fff",
  backgroundImage:
    "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load the image."));
    img.src = src;
  });

/**
 * Clean up the alpha mask: fill interior pin-holes (near-transparent pixels
 * surrounded by opaque ones — the "tiny removed dots" on the subject) and drop
 * isolated floating specks. Only clear outliers are touched (needs 7/8 opaque
 * neighbours), so genuine soft edges — hair, fur — are left intact.
 */
const despeckleMask = (
  src: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  passes = 2,
): Uint8Array => {
  let cur = new Uint8Array(src);
  for (let p = 0; p < passes; p++) {
    const out = new Uint8Array(cur);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const v = cur[i];
        let nOpaque = 0;
        let nTrans = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nv = cur[i + dy * w + dx];
            if (nv >= 250) nOpaque++;
            else if (nv <= 5) nTrans++;
          }
        }
        if (v < 250 && nOpaque >= 7) out[i] = 255; // fill interior hole
        else if (v > 5 && nTrans >= 7) out[i] = 0; // drop floating speck
      }
    }
    cur = out;
  }
  return cur;
};

const BackgroundRemover = () => {
  const nav = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [dragging, setDragging] = useState(false);

  // Zoom/pan lightbox
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const openZoom = (src: string | null) => {
    if (!src) return;
    setScale(1);
    setTx(0);
    setTy(0);
    setZoomSrc(src);
  };
  const zoomReset = () => {
    setScale(1);
    setTx(0);
    setTy(0);
  };
  const zoomBy = (factor: number) =>
    setScale((s) => Math.min(8, Math.max(1, +(s * factor).toFixed(3))));

  const stageRef = useRef<HTMLDivElement>(null);
  // Non-passive wheel listener so we can zoom without scrolling the page.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !zoomSrc) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.12 : 1 / 1.12);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomSrc]);
  // Esc closes the zoom viewer.
  useEffect(() => {
    if (!zoomSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomSrc(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomSrc]);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast.error("Image is too large (max 25MB).");
      return;
    }
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f);
    setResultUrl(null);
    setOriginalUrl(URL.createObjectURL(f));
  };

  const removeBg = async () => {
    if (!file || !originalUrl) return;
    setProcessing(true);
    setProgress(0);
    setStage("Loading AI model…");
    try {
      const { AutoModel, AutoProcessor, RawImage, env } = await import(
        "@huggingface/transformers"
      );
      // Load model weights from the HF hub (browser only, nothing uploaded).
      env.allowLocalModels = false;

      const onProgress = (p: any) => {
        if (p?.status === "progress" && p?.total) {
          const pct = Math.round((p.loaded / p.total) * 100);
          setProgress(pct);
          setStage(`Downloading model (first run only)… ${pct}%`);
        }
      };

      // RMBG-1.4: a high-accuracy foreground/background segmentation model.
      // The processor config MUST be given explicitly — that's the piece
      // people usually miss, which produces the "eaten subject" mess.
      const model = await AutoModel.from_pretrained("briaai/RMBG-1.4", {
        config: { model_type: "custom" },
        progress_callback: onProgress,
      } as any);
      const processor = await AutoProcessor.from_pretrained("briaai/RMBG-1.4", {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 1 / 255,
          size: { width: 1024, height: 1024 },
        },
      } as any);

      setStage("Removing background…");
      setProgress(0);

      const image = await RawImage.fromURL(originalUrl);
      const processed: any = await (processor as any)(image);
      const modelOut: any = await (model as any)({ input: processed.pixel_values });

      // `output[0]` is the alpha mask in [0,1]; scale to 0-255 and back to the
      // original size, then use it as the image's alpha channel.
      const mask: any = await RawImage.fromTensor(
        modelOut.output[0].mul(255).to("uint8"),
      ).resize(image.width, image.height);

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported.");

      const el = await loadImage(originalUrl);
      ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Despeckle the mask so interior pin-holes ("tiny removed dots" on the
      // subject) get filled and floating specks are dropped.
      const alpha = despeckleMask(
        mask.data as Uint8Array,
        canvas.width,
        canvas.height,
        2,
      );
      for (let i = 0; i < alpha.length; i++) {
        pixels.data[4 * i + 3] = alpha[i]; // alpha from the cleaned mask
      }
      ctx.putImageData(pixels, 0, 0);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Failed to encode PNG."))),
          "image/png",
        ),
      );

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      toast.success("Background removed.");
    } catch (e: any) {
      console.error(e);
      toast.error("Couldn't remove the background.", {
        description: String(e?.message ?? e),
      });
    } finally {
      setProcessing(false);
      setStage("");
    }
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    const base = (file?.name ?? "image").replace(/\.[^.]+$/, "");
    a.download = `${base}-no-bg.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const reset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setProgress(0);
  };

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="p-2 rounded-lg bg-indigo-600">
            <Wand2 className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900">
              Background Remover
            </h1>
            <p className="text-[11px] text-gray-500">
              Upload a photo, remove its background, and download a transparent PNG.
            </p>
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-none" />
          <p className="text-[11px] text-green-800">
            Runs entirely in your browser — the photo is <b>never uploaded</b> to a
            server. (The AI model downloads once on first use.)
          </p>
        </div>

        {/* Upload zone (no file yet) */}
        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => inputRef.current?.click()}
            className={
              "cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors " +
              (dragging
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-300 bg-white hover:border-indigo-300")
            }
          >
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
              <Upload className="h-6 w-6 text-indigo-600" />
            </div>
            <p className="text-sm font-medium text-gray-800">
              Drop an image here, or click to choose
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              JPG, PNG or WebP · up to 25MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                pickFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <>
            {/* Before / after */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <figure className="rounded-xl border bg-white overflow-hidden">
                <figcaption className="px-3 py-1.5 border-b bg-gray-50 text-[11px] font-medium text-gray-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-3 w-3" /> Original
                  </span>
                  {originalUrl && (
                    <button
                      type="button"
                      onClick={() => openZoom(originalUrl)}
                      className="text-gray-400 hover:text-gray-700"
                      title="Zoom"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </figcaption>
                <div className="h-64 flex items-center justify-center p-2 bg-gray-50">
                  {originalUrl && (
                    <img
                      src={originalUrl}
                      alt="Original"
                      onClick={() => openZoom(originalUrl)}
                      className="max-h-full max-w-full object-contain cursor-zoom-in"
                    />
                  )}
                </div>
              </figure>

              <figure className="rounded-xl border bg-white overflow-hidden">
                <figcaption className="px-3 py-1.5 border-b bg-gray-50 text-[11px] font-medium text-gray-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="h-3 w-3" /> Result
                  </span>
                  {resultUrl && (
                    <button
                      type="button"
                      onClick={() => openZoom(resultUrl)}
                      className="text-gray-400 hover:text-gray-700"
                      title="Zoom"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </figcaption>
                <div className="h-64 flex items-center justify-center p-2" style={CHECKER}>
                  {resultUrl ? (
                    <img
                      src={resultUrl}
                      alt="No background"
                      onClick={() => openZoom(resultUrl)}
                      className="max-h-full max-w-full object-contain cursor-zoom-in"
                    />
                  ) : processing ? (
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mx-auto" />
                      <p className="text-[11px] text-gray-600 mt-2">{stage}</p>
                      {progress > 0 && (
                        <div className="w-40 h-1.5 bg-gray-200 rounded-full mt-2 mx-auto overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400">
                      Click “Remove Background” to process.
                    </p>
                  )}
                </div>
              </figure>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {!resultUrl ? (
                <Button
                  size="sm"
                  onClick={removeBg}
                  disabled={processing}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                >
                  {processing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  {processing ? "Processing…" : "Remove Background"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={download}
                  className="gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PNG
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={reset}
                disabled={processing}
                className="gap-1.5"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Start over
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Zoom / pan lightbox */}
      {zoomSrc && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/80"
          onMouseUp={() => (panRef.current = null)}
          onMouseLeave={() => (panRef.current = null)}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-[11px] text-white/80">
              Scroll to zoom · drag to pan · double-click to toggle · Esc to close
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => zoomBy(1 / 1.25)}
                className="p-1.5 rounded-md text-white hover:bg-white/10"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-[11px] text-white/80 w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoomBy(1.25)}
                className="p-1.5 rounded-md text-white hover:bg-white/10"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={zoomReset}
                className="px-2 py-1 rounded-md text-[11px] text-white hover:bg-white/10"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setZoomSrc(null)}
                className="p-1.5 rounded-md text-white hover:bg-white/10"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={stageRef}
            className="flex-1 overflow-hidden flex items-center justify-center select-none"
            style={CHECKER}
            onMouseDown={(e) => {
              panRef.current = { x: e.clientX, y: e.clientY, tx, ty };
            }}
            onMouseMove={(e) => {
              if (!panRef.current) return;
              setTx(panRef.current.tx + (e.clientX - panRef.current.x));
              setTy(panRef.current.ty + (e.clientY - panRef.current.y));
            }}
            onDoubleClick={() => (scale === 1 ? zoomBy(2.5) : zoomReset())}
          >
            <img
              src={zoomSrc}
              alt="Zoom"
              draggable={false}
              className="max-h-[85vh] max-w-[92vw] object-contain"
              style={{
                transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
                cursor: scale > 1 ? "grab" : "zoom-in",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundRemover;
