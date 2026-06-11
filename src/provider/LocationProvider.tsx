import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Module-level geolocation. Requested ONCE when the Document module
// mounts and cached. Every sign action reads from here instead of
// blocking on `navigator.geolocation.getCurrentPosition` per click —
// that approach was racy and the second-long permission prompt was
// being dismissed by some browsers between sign clicks.
//
// Status:
//   - "idle"        : not yet asked
//   - "prompting"   : permission prompt visible
//   - "granted"     : we have a fix in `geo`
//   - "denied"      : user denied (try again with `retry`)
//   - "unavailable" : browser has no geolocation API or hard error
export interface Geo {
  lat: number;
  lng: number;
  accuracy: number | null;
  capturedAt: number; // epoch ms
}

type Status = "idle" | "prompting" | "granted" | "denied" | "unavailable";

interface Ctx {
  geo: Geo | null;
  status: Status;
  error: string | null;
  /** Re-trigger the permission prompt / refresh the fix. */
  retry: () => void;
}

const LocationContext = createContext<Ctx>({
  geo: null,
  status: "idle",
  error: null,
  retry: () => {},
});

const CACHE_KEY = "gmitp003.location.v1";
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

const loadCache = (): Geo | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Geo;
    if (!v?.capturedAt || Date.now() - v.capturedAt > CACHE_TTL_MS) return null;
    if (typeof v.lat !== "number" || typeof v.lng !== "number") return null;
    return v;
  } catch {
    return null;
  }
};
const saveCache = (g: Geo) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(g));
  } catch {
    /* ignore quota errors */
  }
};

const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [geo, setGeo] = useState<Geo | null>(() => loadCache());
  const [status, setStatus] = useState<Status>(() =>
    loadCache() ? "granted" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const askedRef = useRef(false);

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      setError("Geolocation API not available in this browser.");
      return;
    }
    setStatus("prompting");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: Geo = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          capturedAt: Date.now(),
        };
        setGeo(next);
        saveCache(next);
        setStatus("granted");
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError(
            "Location permission denied. Sign actions will work but the verification QR won't include a location.",
          );
        } else {
          setStatus("unavailable");
          setError(err.message || "Could not capture location.");
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  // Auto-request on first mount unless we already have a fresh cache.
  useEffect(() => {
    if (askedRef.current) return;
    askedRef.current = true;
    if (geo && Date.now() - geo.capturedAt < CACHE_TTL_MS) {
      setStatus("granted");
      return;
    }
    request();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LocationContext.Provider value={{ geo, status, error, retry: request }}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationProvider;

export const useLocation = () => useContext(LocationContext);
