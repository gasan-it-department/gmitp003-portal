// Browser geolocation helper. Returns `null` instead of throwing so the
// sign flow never blocks on a permission denial — the signature still
// goes through, the QR just won't have a location pin.
export interface Geo {
  lat: number;
  lng: number;
  accuracy?: number | null;
}

export const captureGeo = async (timeoutMs = 6000): Promise<Geo | null> => {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;
  return new Promise<Geo | null>((resolve) => {
    let settled = false;
    const done = (val: Geo | null) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };
    const t = setTimeout(() => done(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(t);
        done({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        });
      },
      () => {
        clearTimeout(t);
        done(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 },
    );
  });
};
