import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

import {
  searchMedicineStock,
  directDispense,
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
} from "lucide-react";

interface Props {
  token: string;
  lineId: string;
}

/**
 * Direct dispense — release medicine WITHOUT a doctor's prescription
 * (walk-ins, counter sales). Built for a hardware barcode scanner: the
 * code box keeps focus, the scanner "types" the code and sends Enter,
 * the medicine resolves instantly; after dispensing the form resets and
 * focus returns for the next scan. Only storages the user holds
 * Dispense & Stock Access on are selectable — the server enforces the
 * same rule regardless, deducts FEFO (never from expired batches), and
 * writes a Medicine Logs audit row.
 */
const DirectDispense = ({ token, lineId }: Props) => {
  const codeRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [query] = useDebounce(text.trim(), 350);
  const [picked, setPicked] = useState<MedicineSearchHit | null>(null);
  const [storage, setStorage] = useState<MedicineSearchStorage | null>(null);
  const [qty, setQty] = useState("1");
  const [patient, setPatient] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

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
    // Unambiguous → preselect; otherwise the user must choose.
    setStorage(accessible.length === 1 ? accessible[0] : null);
  };

  // Hardware scanner: code + Enter → resolve immediately (barcode exact
  // match first, else the single search hit).
  const onEnter = () => {
    if (picked) return;
    const list = data?.list ?? [];
    const exact = list.find((m) => m.barcode && m.barcode === text.trim());
    if (exact) choose(exact);
    else if (list.length === 1) choose(list[0]);
  };

  const reset = (keepFocus = true) => {
    setPicked(null);
    setStorage(null);
    setText("");
    setQty("1");
    setPatient("");
    setNote("");
    if (keepFocus) setTimeout(() => codeRef.current?.focus(), 50);
  };

  // auto-resolve when a scan produced exactly one barcode-exact hit
  useEffect(() => {
    if (picked || !data?.list) return;
    const exact = data.list.find(
      (m) => m.barcode && m.barcode === query,
    );
    if (exact) choose(exact);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query]);

  const dispense = async () => {
    if (!picked || !storage) return;
    const n = parseInt(qty, 10);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }
    setBusy(true);
    try {
      const r = await directDispense(token, {
        lineId,
        storageId: storage.id,
        medicineId: picked.id,
        quantity: n,
        patientName: patient.trim() || undefined,
        note: note.trim() || undefined,
      });
      const out = r.results?.[0];
      if (out?.status === "dispensed" || out?.status === "duplicate") {
        toast.success(`Dispensed ${n} × ${picked.name}`, {
          description: `From ${storage.name ?? storage.refNumber} — logged in Medicine Logs.`,
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
      {/* Scan / search box — keeps focus for hardware scanners */}
      <InputGroup className="bg-white">
        <InputGroupAddon>
          {isFetching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
          ) : (
            <ScanBarcode className="h-3.5 w-3.5 text-gray-400" />
          )}
        </InputGroupAddon>
        <InputGroupInput
          ref={codeRef}
          autoFocus
          placeholder="Scan a barcode, or type a medicine name / serial…"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (picked) {
              setPicked(null);
              setStorage(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter();
            }
          }}
          className="h-9 text-sm"
        />
      </InputGroup>

      {/* Lookup results */}
      {!picked && query.length >= 2 && (
        <div className="max-h-[30vh] overflow-auto space-y-1.5">
          {hits.length === 0 && !isFetching ? (
            <p className="text-[11px] text-gray-400 text-center py-3">
              No medicine matches “{query}”.
            </p>
          ) : (
            hits.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => choose(m)}
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
      )}

      {/* Selected medicine → storage + quantity */}
      {picked && (
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Pill className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <p className="text-xs font-semibold text-gray-900 truncate">
                {picked.name}
                <span className="text-gray-400 font-normal">
                  {" "}
                  · #{picked.serialNumber}
                </span>
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-[10px] gap-1"
              onClick={() => reset()}
            >
              <RotateCcw className="h-2.5 w-2.5" />
              Change
            </Button>
          </div>

          <div className="p-3 space-y-2.5">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
              Dispense from
            </p>
            <div className="space-y-1.5">
              {picked.storages.length === 0 && (
                <p className="text-[11px] text-gray-400">
                  No stock in any storage.
                </p>
              )}
              {picked.storages.map((s) => {
                const usable = s.accessible && s.onHand > 0;
                const active = storage?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={!usable}
                    onClick={() => setStorage(s)}
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
                          {" "}
                          · {s.onHand} on hand
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

            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-[10px] font-semibold text-gray-600 mb-1">
                  Quantity *
                </p>
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
              <p className="text-[10px] font-semibold text-gray-600 mb-1">
                Note (optional)
              </p>
              <Input
                placeholder="Reason / remarks"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <Button
              disabled={!storage || busy}
              onClick={dispense}
              className="w-full h-9 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <HandHeart className="h-3.5 w-3.5" />
              )}
              Dispense{storage ? ` from ${storage.name ?? storage.refNumber}` : ""}
            </Button>
            <p className="text-[10px] text-gray-400 text-center">
              Deducted earliest-expiry first (never from expired batches) ·
              recorded in Medicine Logs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectDispense;
