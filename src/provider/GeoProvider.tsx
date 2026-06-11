import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

// Shared geolocation context for the Document module. We request a single
// high-accuracy fix on mount, cache it, and expose a refresh() so any
// downstream sign flow can grab the most recent coords without having to
// trigger its own permission prompt right before the user clicks Sign.
//
// Lifecycle:
//   1. Mount → check permission state (when supported)
//   2. If granted/prompt → call getCurrentPosition(high accuracy, 8s)
//   3. Refresh again every 5 min while mounted so stale coords don't
//      get stamped on a long session.
//   4. captureForSign() = "give me the freshest coords you have, or wait
//      up to 4s for a new fix if we have nothing cached."

export interface GeoCoords {
  lat: number;
  lng: number;
  accuracy: number | null;
  /** Unix ms when these coords were captured */
  at: number;
}

export type GeoStatus =
  | "idle"
  | "requesting"
  | "ready"
  | "denied"
  | "unavailable"
  | "error";

interface GeoCtx {
  coords: GeoCoords | null;
  status: GeoStatus;
  error: string | null;
  refresh: () => Promise<GeoCoords | null>;
  /** Grab the freshest coords — used by sign flows. Triggers a refresh
   *  if we have none, otherwise returns the cached value. */
  captureForSign: () => Promise<GeoCoords | null>;
}

const Ctx = createContext<GeoCtx | null>(null);

const REFRESH_MS = 5 * 60 * 1000; // re-fetch every 5 min

const requestOnce = (timeoutMs: number): Promise<GeoCoords | null> => {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (v: GeoCoords | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    const t = setTimeout(() => done(null), timeoutMs + 500);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(t);
        done({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy ?? null,
          at: Date.now(),
        });
      },
      () => {
        clearTimeout(t);
        done(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
};

export const GeoProvider = ({ children }: { children: ReactNode }) => {
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const inflightRef = useRef<Promise<GeoCoords | null> | null>(null);

  const refresh = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Geolocation isn't supported in this browser.");
      return null;
    }
    if (inflightRef.current) return inflightRef.current;
    setStatus("requesting");
    setError(null);
    const p = (async () => {
      const result = await requestOnce(8000);
      if (!result) {
        // Differentiate denied vs error using the Permissions API when
        // available; falls back to a generic "denied".
        try {
          const perm = await navigator.permissions?.query?.({
            name: "geolocation" as PermissionName,
          });
          if (perm?.state === "denied") {
            setStatus("denied");
            setError(
              "Location permission was denied. Enable it for this site in your browser settings.",
            );
          } else {
            setStatus("error");
            setError(
              "Couldn't get your location. Try clicking the location icon in your browser address bar.",
            );
          }
        } catch {
          setStatus("error");
          setError("Couldn't get your location.");
        }
        return null;
      }
      setCoords(result);
      setStatus("ready");
      return result;
    })();
    inflightRef.current = p;
    try {
      const out = await p;
      return out;
    } finally {
      inflightRef.current = null;
    }
  }, []);

  const captureForSign = useCallback(async () => {
    // Use cached if fresh (< 5 min old), otherwise refresh.
    if (coords && Date.now() - coords.at < REFRESH_MS) return coords;
    return refresh();
  }, [coords, refresh]);

  // On mount: try once. Don't error noisily if we can't — the user might
  // simply not have granted permission yet. The banner surfaces this.
  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (status === "ready") refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<GeoCtx>(
    () => ({ coords, status, error, refresh, captureForSign }),
    [coords, status, error, refresh, captureForSign],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useGeo = (): GeoCtx => {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useGeo must be used within <GeoProvider>");
  }
  return v;
};
