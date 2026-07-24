import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

import {
  searchMedicineStock,
  directDispense,
  directDispenseMulti,
  type MedicineSearchHit,
  type MedicineSearchStorage,
} from "@/db/statements/medicine";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ScanBarcode,
  Pill,
  Package,
  ShieldCheck,
  Eye,
  Loader2,
  HandHeart,
  RotateCcw,
  Plus,
  Trash2,
  User,
} from "lucide-react";

interface Props {
  token: string;
  lineId: string;
}

type Mode = "single" | "bulk";

interface CartLine {
  key: string;
  medicineId: string;
  name: string;
  serialNumber: string;
  storageId: string;
  storageLabel: string;
  quantity: number;
}

/**
 * Direct dispense — release medicine WITHOUT a doctor's prescription.
 * Two modes:
 *   • Single — one medicine, scan-and-go (hardware scanner friendly).
 *   • Bulk   — ONE patient, many scanned items each with a quantity,
 *              dispensed together as a single record (all-or-nothing).
 * Storages the user can't Dispense & Stock on are shown but not
 * selectable; the server enforces the same rule and deducts FEFO
 * (never expired) with full audit + dispense-history records.
 */
const DirectDispense = ({ token, lineId }: Props) => {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex p-0.5 bg-gray-100 rounded-lg">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`flex-1 h-8 text-xs font-medium rounded-md transition ${
            mode === "single"
              ? "bg-white shadow-sm text-blue-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Single medicine
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`flex-1 h-8 text-xs font-medium rounded-md transition ${
            mode === "bulk"
              ? "bg-white shadow-sm text-blue-700"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Bulk · one patient
        </button>
      </div>

      {mode === "single" ? (
        <SingleDispense token={token} lineId={lineId} />
      ) : (
        <BulkDispense token={token} lineId={lineId} />
      )}
    </div>
  );
};

/* ── Shared medicine picker ──────────────────────────────────────────────
   Scan/search → choose a medicine → choose an accessible storage. Calls
   onResolved with the picked medicine + storage. */
const usePicker = (token: string, lineId: string) => {
  const [text, setText] = useState("");
  const [query] = useDebounce(text.trim(), 350);
  const [picked, setPicked] = useState<MedicineSearchHit | null>(null);
  const [storage, setStorage] = useState<MedicineSearchStorage | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["direct-dispense-lookup", lineId, query],
    queryFn: () => searchMedicineStock(token, lineId, query),
    enabled: !picked && query.length >= 2,
    refetchOnWindowFocus: false,
  });
  const hits = !picked && query.length >= 2 ? (data?.list ?? []) : [];

  const choose = (m: MedicineSearchHit) => {
    setPicked(m);
    const accessible = m.storages.filter((s) => s.accessible && s.onHand > 0);
    setStorage(accessible.length === 1 ? accessible[0] : null);
  };
  const onEnter = () => {
    if (picked) return;
    const list = data?.list ?? [];
    const exact = list.find((m) => m.barcode && m.barcode === text.trim());
    if (exact) choose(exact);
    else if (list.length === 1) choose(list[0]);
  };
  const clearPick = () => {
    setPicked(null);
    setStorage(null);
    setText("");
  };
  useEffect(() => {
    if (picked || !data?.list) return;
    const exact = data.list.find((m) => m.barcode && m.barcode === query);
    if (exact) choose(exact);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query]);

  return {
    text, setText, query, picked, setPicked, storage, setStorage,
    isFetching, hits, choose, onEnter, clearPick,
  };
};

const ScanBox = ({
  inputRef, isFetching, text, onText, onEnter,
}: {
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isFetching: boolean;
  text: string;
  onText: (v: string) => void;
  onEnter: () => void;
}) => (
  <InputGroup className="bg-white">
    <InputGroupAddon>
      {isFetching ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
      ) : (
        <ScanBarcode className="h-3.5 w-3.5 text-gray-400" />
      )}
    </InputGroupAddon>
    <InputGroupInput
      ref={inputRef}
      autoFocus
      placeholder="Scan a barcode/QR, or type a medicine name / serial…"
      value={text}
      onChange={(e) => onText(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
      className="h-9 text-sm"
    />
  </InputGroup>
);

const HitList = ({
  hits, isFetching, query, onChoose,
}: {
  hits: MedicineSearchHit[];
  isFetching: boolean;
  query: string;
  onChoose: (m: MedicineSearchHit) => void;
}) => (
  <div className="max-h-[26vh] overflow-auto space-y-1.5">
    {hits.length === 0 && !isFetching ? (
      <p className="text-[11px] text-gray-400 text-center py-3">
        No medicine matches “{query}”.
      </p>
    ) : (
      hits.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChoose(m)}
          className="w-full border rounded-lg bg-white px-3 py-2 flex items-center justify-between gap-2 hover:border-blue-300 hover:bg-blue-50/40 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Pill className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {m.name}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                #{m.serialNumber}
                {m.barcode ? ` · ${m.barcode}` : ""}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${
              m.totalOnHand > 0
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {m.totalOnHand} on hand
          </Badge>
        </button>
      ))
    )}
  </div>
);

const StoragePicker = ({
  picked, storage, onPick,
}: {
  picked: MedicineSearchHit;
  storage: MedicineSearchStorage | null;
  onPick: (s: MedicineSearchStorage) => void;
}) => (
  <div className="space-y-1.5">
    {picked.storages.length === 0 && (
      <p className="text-[11px] text-gray-400">No stock in any storage.</p>
    )}
    {picked.storages.map((s) => {
      const usable = s.accessible && s.onHand > 0;
      const active = storage?.id === s.id;
      return (
        <button
          key={s.id}
          type="button"
          disabled={!usable}
          onClick={() => onPick(s)}
          className={`w-full border rounded-md px-2.5 py-1.5 flex items-center justify-between gap-2 text-left transition ${
            active
              ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
              : usable
                ? "hover:border-blue-300"
                : "opacity-60 cursor-not-allowed bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <p className="text-[11px] font-medium text-gray-800 truncate">
              {s.name ?? s.refNumber}
              <span className="text-gray-400 font-normal">
                {" "}· {s.onHand} on hand
              </span>
            </p>
          </div>
          {s.accessible ? (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 gap-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 flex-shrink-0"
            >
              <ShieldCheck className="h-2.5 w-2.5" />
              Dispense &amp; Stock
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 gap-0.5 bg-gray-50 text-gray-500 border-gray-200 flex-shrink-0"
              title="You have no Dispense & Stock Access on this storage"
            >
              <Eye className="h-2.5 w-2.5" />
              View only
            </Badge>
          )}
        </button>
      );
    })}
  </div>
);

/* ── SINGLE ──────────────────────────────────────────────────────────── */
const SingleDispense = ({ token, lineId }: Props) => {
  const codeRef = useRef<HTMLInputElement>(null);
  const p = usePicker(token, lineId);
  const [qty, setQty] = useState("1");
  const [patient, setPatient] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    p.clearPick();
    setQty("1");
    setPatient("");
    setNote("");
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const dispense = async () => {
    if (!p.picked || !p.storage) return;
    const n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    setBusy(true);
    try {
      const r = await directDispense(token, {
        lineId,
        storageId: p.storage.id,
        medicineId: p.picked.id,
        quantity: n,
        patientName: patient.trim() || undefined,
        note: note.trim() || undefined,
      });
      const out = r.results?.[0];
      if (out?.status === "dispensed" || out?.status === "duplicate") {
        toast.success(`Dispensed ${n} × ${p.picked.name}`, {
          description: `From ${p.storage.name ?? p.storage.refNumber} — recorded in Dispense History.`,
        });
        reset();
      } else {
        toast.error("Not dispensed", { description: out?.message ?? "Failed" });
      }
    } catch (e: any) {
      toast.error("Not dispensed", {
        description: e?.response?.data?.message ?? e?.message ?? "Failed",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <ScanBox
        inputRef={codeRef}
        isFetching={p.isFetching}
        text={p.text}
        onText={(v) => {
          p.setText(v);
          if (p.picked) {
            p.setPicked(null);
            p.setStorage(null);
          }
        }}
        onEnter={p.onEnter}
      />

      {!p.picked && p.query.length >= 2 && (
        <HitList hits={p.hits} isFetching={p.isFetching} query={p.query} onChoose={p.choose} />
      )}

      {p.picked && (
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Pill className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-xs font-semibold text-gray-900 truncate">
                {p.picked.name}
                <span className="text-gray-400 font-normal">
                  {" "}· #{p.picked.serialNumber}
                </span>
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[10px] gap-1"
              onClick={reset}
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Change
            </Button>
          </div>

          <div className="p-3 space-y-2.5">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
              Dispense from
            </p>
            <StoragePicker picked={p.picked} storage={p.storage} onPick={p.setStorage} />

            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-600 mb-1">Quantity *</p>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-semibold text-gray-600 mb-1">
                  Patient / recipient (optional)
                </p>
                <Input
                  placeholder="Walk-in name"
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-600 mb-1">Note (optional)</p>
              <Input
                placeholder="Reason / remarks"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <Button
              disabled={!p.storage || busy}
              onClick={dispense}
              className="w-full h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <HandHeart className="h-3.5 w-3.5" />
              )}
              Dispense{p.storage ? ` from ${p.storage.name ?? p.storage.refNumber}` : ""}
            </Button>
            <p className="text-[10px] text-gray-400 text-center">
              Earliest-expiry first (never expired) · recorded in Dispense History.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── BULK (one patient, many items) ──────────────────────────────────── */
const BulkDispense = ({ token, lineId }: Props) => {
  const codeRef = useRef<HTMLInputElement>(null);
  const p = usePicker(token, lineId);
  const [qty, setQty] = useState("1");
  const [patient, setPatient] = useState("");
  const [note, setNote] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);

  const addToCart = () => {
    if (!p.picked || !p.storage) return;
    const n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    setCart((c) => [
      ...c,
      {
        key: `${p.picked!.id}-${p.storage!.id}-${Date.now()}`,
        medicineId: p.picked!.id,
        name: p.picked!.name,
        serialNumber: p.picked!.serialNumber,
        storageId: p.storage!.id,
        storageLabel: p.storage!.name ?? p.storage!.refNumber,
        quantity: n,
      },
    ]);
    p.clearPick();
    setQty("1");
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const removeLine = (key: string) =>
    setCart((c) => c.filter((l) => l.key !== key));

  const dispenseAll = async () => {
    if (cart.length === 0) return;
    setBusy(true);
    try {
      const r = await directDispenseMulti(token, {
        lineId,
        patientName: patient.trim() || undefined,
        note: note.trim() || undefined,
        items: cart.map((l) => ({
          storageId: l.storageId,
          medicineId: l.medicineId,
          quantity: l.quantity,
        })),
      });
      toast.success(`Dispensed ${r.itemCount} item(s)`, {
        description: patient.trim()
          ? `To ${patient.trim()} — recorded in Dispense History.`
          : "Recorded in Dispense History.",
      });
      setCart([]);
      setPatient("");
      setNote("");
      p.clearPick();
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (e: any) {
      toast.error("Not dispensed", {
        description: e?.response?.data?.message ?? e?.message ?? "Failed",
      });
    } finally {
      setBusy(false);
    }
  };

  const totalUnits = cart.reduce((s, l) => s + l.quantity, 0);

  return (
    <div className="space-y-3">
      {/* Patient (one for the whole batch) */}
      <div className="border rounded-lg bg-blue-50/40 p-2.5">
        <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
          <User className="h-3 w-3" /> One patient for this batch
        </p>
        <Input
          placeholder="Patient / recipient name (optional)"
          value={patient}
          onChange={(e) => setPatient(e.target.value)}
          className="h-8 text-xs bg-white"
        />
        <Input
          placeholder="Note for the whole batch (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-8 text-xs bg-white mt-1.5"
        />
      </div>

      {/* Scan → resolve → set qty → Add */}
      <ScanBox
        inputRef={codeRef}
        isFetching={p.isFetching}
        text={p.text}
        onText={(v) => {
          p.setText(v);
          if (p.picked) {
            p.setPicked(null);
            p.setStorage(null);
          }
        }}
        onEnter={p.onEnter}
      />
      {!p.picked && p.query.length >= 2 && (
        <HitList hits={p.hits} isFetching={p.isFetching} query={p.query} onChoose={p.choose} />
      )}
      {p.picked && (
        <div className="border rounded-lg bg-white p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Pill className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-xs font-semibold text-gray-900 truncate">
                {p.picked.name}
                <span className="text-gray-400 font-normal">
                  {" "}· #{p.picked.serialNumber}
                </span>
              </p>
            </div>
            <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px] gap-1" onClick={p.clearPick}>
              <RotateCcw className="h-2.5 w-2.5" /> Change
            </Button>
          </div>
          <StoragePicker picked={p.picked} storage={p.storage} onPick={p.setStorage} />
          <div className="flex items-end gap-2">
            <div className="w-24">
              <p className="text-[10px] font-semibold text-gray-600 mb-1">Quantity *</p>
              <Input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Button
              disabled={!p.storage}
              onClick={addToCart}
              className="flex-1 h-8 text-xs gap-1.5"
              variant="outline"
            >
              <Plus className="h-3.5 w-3.5" /> Add to list
            </Button>
          </div>
        </div>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
              To dispense · {cart.length} item(s) · {totalUnits} unit(s)
            </p>
          </div>
          <div className="max-h-[26vh] overflow-auto divide-y">
            {cart.map((l) => (
              <div key={l.key} className="px-3 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gray-800 truncate">
                    {l.name}{" "}
                    <span className="text-gray-400">· ×{l.quantity}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 truncate">
                    #{l.serialNumber} · from {l.storageLabel}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeLine(l.key)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="p-3 border-t">
            <Button
              disabled={busy}
              onClick={dispenseAll}
              className="w-full h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <HandHeart className="h-3.5 w-3.5" />
              )}
              Dispense all{patient.trim() ? ` to ${patient.trim()}` : ""}
            </Button>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              All-or-nothing · one dispense record · earliest-expiry first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectDispense;
