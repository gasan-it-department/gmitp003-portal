import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
//
import { useAuth } from "@/provider/ProtectedRoute";
import { useRoom } from "@/provider/DocumentRoomProvider";
import useLine from "@/hooks/useLine";
import {
  documentReceiveList,
  documentReceiveCreate,
  documentReceiveDisseminate,
  type DocumentReceiveRecord,
} from "@/db/statements/document";
import { getLinetUnits } from "@/db/statement";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Modal from "@/components/custom/Modal";
import { Spinner } from "@/components/ui/spinner";
//icons
import {
  ScanBarcode,
  Search,
  Plus,
  Building2,
  User,
  Inbox,
  FileImage,
  Barcode,
  Printer,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Loader2,
} from "lucide-react";
import axiosClient from "@/db/axios";
import {
  printBarcodeSheet,
  downloadBarcodePdf,
  LABELS_PER_SHEET,
} from "@/utils/barcodeSheet";

interface UnitOption {
  id: string;
  idCode: string | null;
  name: string | null;
}

/**
 * Document Receiving — registry of barcode-stickered physical documents.
 * The receiving personnel sticks a barcode on each incoming document; the
 * mobile scanner (or this page, manually) registers it with a title and the
 * sender — either a unit of the line (dropdown) or a typed name.
 */
const Receiving = () => {
  const auth = useAuth();
  const { room } = useRoom();
  const { line } = useLine();
  const nav = useNavigate();

  /** Which record is mid-send, so only that row shows a spinner. */
  const [sending, setSending] = useState<string | null>(null);
  const disseminate = useMutation({
    mutationFn: (recordId: string) =>
      documentReceiveDisseminate(auth.token as string, {
        recordId,
        roomId: room?.id as string,
      }),
    onSuccess: (r) => {
      toast.success(
        `Routing draft created from ${r.pages} scanned page` +
          `${r.pages === 1 ? "" : "s"}. Choose who receives it.`,
      );
      // Straight into the routing wizard, which is where the offices are
      // picked — the draft on its own does nothing until it is configured.
      nav(`../dissemination/set-up/${r.queueRoomId}`);
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.message ??
          e?.message ??
          "Could not send this document onward.",
      ),
    onSettled: () => setSending(null),
  });
  const lineId = room?.lineId as string | undefined;
  const qc = useQueryClient();

  const [text, setText] = useState("");
  const [query] = useDebounce(text, 600);
  const [dirFilter, setDirFilter] = useState<"all" | "in" | "out">("all");
  const [pages, setPages] = useState<DocumentReceiveRecord[][]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["document-receive", lineId, query, dirFilter, cursor],
    queryFn: async () => {
      const page = await documentReceiveList(
        auth.token as string,
        lineId as string,
        cursor,
        "20",
        query,
        dirFilter === "all" ? undefined : dirFilter,
      );
      setPages((prev) => (cursor ? [...prev, page.list] : [page.list]));
      return page;
    },
    enabled: !!auth.token && !!lineId,
    refetchOnWindowFocus: false,
  });

  const rows = useMemo(() => pages.flat(), [pages]);

  // ── register dialog ────────────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [title, setTitle] = useState("");
  const [senderMode, setSenderMode] = useState<"unit" | "manual">("unit");
  const [senderUnitId, setSenderUnitId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [direction, setDirection] = useState<"in" | "out">("in");

  // ── barcode-label generator ─────────────────────────────────────────────
  const [bcOpen, setBcOpen] = useState(false);
  const [bcUnitId, setBcUnitId] = useState("");
  // The municipality and province are facts about the line, not opinions.
  // They used to be free text defaulted to "Gasan" / "Marinduque", so a typo
  // — or another LGU running this — printed a whole sheet of wrong stickers,
  // and stickers are the one thing you cannot correct after the fact.
  const lineMunicipality = line?.municipal?.name ?? "";
  const lineProvince = line?.province?.name ?? "";
  const [bcMunicipality, setBcMunicipality] = useState("");
  const [bcProvince, setBcProvince] = useState("");

  // Select them as soon as the line is known, and re-select if it changes.
  useEffect(() => {
    if (lineMunicipality) setBcMunicipality(lineMunicipality);
    if (lineProvince) setBcProvince(lineProvince);
  }, [lineMunicipality, lineProvince]);
  const [bcSheets, setBcSheets] = useState("1");

  const { data: unitsData } = useQuery({
    queryKey: ["line-units-all", lineId],
    queryFn: () =>
      getLinetUnits(auth.token as string, lineId as string, null, "200", ""),
    enabled: !!auth.token && !!lineId && (open || bcOpen),
    refetchOnWindowFocus: false,
  });
  const units: UnitOption[] = unitsData?.list ?? [];

  const bcOpts = () => {
    const unit = units.find((u) => u.id === bcUnitId);
    const unitName = unit?.name?.trim();
    if (!unitName) {
      toast.error("Pick the unit / office the labels are for.");
      return null;
    }
    if (!bcMunicipality.trim() || !bcProvince.trim()) {
      toast.error(
        "Your line has no municipality or province on record yet — " +
          "set it in the line profile before printing labels.",
      );
      return null;
    }
    return {
      municipality: bcMunicipality.trim(),
      province: bcProvince.trim(),
      unit: unitName,
      sheets: Math.max(1, Math.min(20, parseInt(bcSheets, 10) || 1)),
    };
  };

  const onDownloadPdf = () => {
    const o = bcOpts();
    if (!o) return;
    const made = downloadBarcodePdf(o);
    toast.success(`Downloaded A4 PDF — ${made} label(s).`);
    setBcOpen(false);
  };

  const onPrintBarcodes = () => {
    const o = bcOpts();
    if (!o) return;
    const made = printBarcodeSheet(o);
    if (made === 0) {
      toast.error("Pop-up blocked", {
        description: "Allow pop-ups for this site, then try again.",
      });
      return;
    }
    toast.success(`Generating ${made} label(s) to print.`);
    setBcOpen(false);
  };

  const resetForm = () => {
    setBarcode("");
    setTitle("");
    setSenderMode("unit");
    setSenderUnitId("");
    setSenderName("");
    setDirection("in");
  };

  const onRegister = async () => {
    const code = barcode.trim();
    const t = title.trim();
    if (!code || !t) {
      toast.error("Barcode and title are required.");
      return;
    }
    if (senderMode === "unit" && !senderUnitId) {
      toast.error("Select the sending unit, or switch to manual sender.");
      return;
    }
    if (senderMode === "manual" && !senderName.trim()) {
      toast.error("Type the sender's name.");
      return;
    }
    setSaving(true);
    try {
      const unit = units.find((u) => u.id === senderUnitId);
      const res = await documentReceiveCreate(auth.token as string, {
        lineId: lineId as string,
        barcode: code,
        title: t,
        senderUnitId: senderMode === "unit" ? senderUnitId : null,
        senderUnitName: senderMode === "unit" ? (unit?.name ?? null) : null,
        senderName: senderMode === "manual" ? senderName.trim() : null,
        direction,
        userId: auth.userId ?? null,
      });
      if (res.existing) {
        toast.warning("This barcode is already registered.", {
          description: `"${res.record.title}" — nothing was duplicated.`,
        });
      } else {
        toast.success("Document registered.");
      }
      setOpen(false);
      resetForm();
      setCursor(null);
      setPages([]);
      await qc.invalidateQueries({ queryKey: ["document-receive"] });
    } catch (e: any) {
      toast.error("Failed to register", {
        description: String(e?.response?.data?.message ?? e?.message ?? e),
      });
    } finally {
      setSaving(false);
    }
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  };

  return (
    <div className="w-full h-full flex flex-col p-4 gap-4 overflow-auto">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <ScanBarcode className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Document Receiving
            </h2>
            <p className="text-xs text-gray-500">
              Barcode-stickered documents logged by receiving personnel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setBcOpen(true)}
            className="gap-2"
          >
            <Barcode className="h-4 w-4" /> Generate barcodes
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Register document
          </Button>
        </div>
      </div>

      {/* search + direction filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setCursor(null);
              setPages([]);
            }}
            placeholder="Search barcode, title, sender…"
            className="pl-9"
          />
        </div>
        <div className="inline-flex rounded-md border bg-white p-0.5">
          {(
            [
              { key: "all", label: "All" },
              { key: "in", label: "IN" },
              { key: "out", label: "OUT" },
            ] as const
          ).map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                setDirFilter(o.key);
                setCursor(null);
                setPages([]);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                dirFilter === o.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* table */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">
                Dir.
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider">
                Barcode
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider">
                Title
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider">
                Sender
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider">
                Received by
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider">
                Pages
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider">
                Date received
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">
                Send onward
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.direction === "out" ? (
                    <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200 font-medium">
                      <ArrowUpRight className="h-3 w-3" /> OUT
                    </Badge>
                  ) : (
                    <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 font-medium">
                      <ArrowDownLeft className="h-3 w-3" /> IN
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.barcode}</TableCell>
                <TableCell className="text-sm font-medium text-gray-900">
                  {r.title}
                </TableCell>
                <TableCell className="text-sm">
                  {r.senderUnitName ? (
                    <Badge variant="outline" className="gap-1 font-normal">
                      <Building2 className="h-3 w-3 text-blue-600" />
                      {r.senderUnitName}
                    </Badge>
                  ) : r.senderName ? (
                    <span className="inline-flex items-center gap-1 text-gray-700">
                      <User className="h-3 w-3 text-gray-400" />
                      {r.senderName}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {r.receivedByName ?? "—"}
                </TableCell>
                <TableCell>
                  {r.pages && r.pages.length > 0 ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <FileImage className="h-3.5 w-3.5 text-blue-500" />
                      {r.pages.map((p) => (
                        <a
                          key={p.id}
                          href={`${axiosClient.defaults.baseURL}/document/receive/page/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          p{p.page}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {fmt(r.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  {(() => {
                    // Nothing to send until it has been scanned: routing
                    // delivers a file, and the scan is the only file a
                    // received document has. The server refuses either way
                    // — this just says so before the click rather than
                    // after it.
                    const scanned = (r.pages?.length ?? 0) > 0;
                    return (
                      <Button
                        size="sm"
                        variant={scanned ? "default" : "ghost"}
                        disabled={!scanned || !room?.id || sending === r.id}
                        title={
                          scanned
                            ? "Send this document to other offices"
                            : "Scan this document with the mobile app first"
                        }
                        className={`h-7 text-[11px] px-2.5 ${
                          scanned ? "" : "text-gray-400 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          setSending(r.id);
                          disseminate.mutate(r.id);
                        }}
                      >
                        {sending === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-3 w-3 mr-1" />
                            {scanned ? "Route" : "Not scanned"}
                          </>
                        )}
                      </Button>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !isFetching ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="py-12 text-center">
                    <Inbox className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      No documents yet
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {query
                        ? `No matches for "${query}"`
                        : "Register the first received document, or scan one from the mobile app."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <div className="flex items-center justify-center p-3 border-t">
          {isFetching ? (
            <Spinner className="h-4 w-4" />
          ) : data?.hasMore ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCursor(data?.lastCursor ?? null)}
            >
              Load more
            </Button>
          ) : (
            <span className="text-xs text-gray-400">
              {rows.length} document{rows.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      {/* register dialog */}
      <Modal
        title="Register received document"
        onOpen={open}
        setOnOpen={() => {
          setOpen(false);
          resetForm();
        }}
        footer={1}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-700">Direction</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Button
                type="button"
                variant={direction === "in" ? "default" : "outline"}
                onClick={() => setDirection("in")}
                className="gap-1.5"
              >
                <ArrowDownLeft className="h-4 w-4" /> IN (received)
              </Button>
              <Button
                type="button"
                variant={direction === "out" ? "default" : "outline"}
                onClick={() => setDirection("out")}
                className="gap-1.5"
              >
                <ArrowUpRight className="h-4 w-4" /> OUT (released)
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">
              Barcode (from the sticker)
            </label>
            <Input
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or type the barcode value"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">
              Document title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Purchase Request — Office Supplies"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Sender</label>
            <div className="flex gap-2 mt-1 mb-2">
              <Button
                type="button"
                size="sm"
                variant={senderMode === "unit" ? "default" : "outline"}
                onClick={() => setSenderMode("unit")}
                className="gap-1"
              >
                <Building2 className="h-3.5 w-3.5" /> Unit in line
              </Button>
              <Button
                type="button"
                size="sm"
                variant={senderMode === "manual" ? "default" : "outline"}
                onClick={() => setSenderMode("manual")}
                className="gap-1"
              >
                <User className="h-3.5 w-3.5" /> Other sender
              </Button>
            </div>
            {senderMode === "unit" ? (
              <Select value={senderUnitId} onValueChange={setSenderUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the sending unit…" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.idCode ?? u.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Type the sender's name / office"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={onRegister} disabled={saving} className="gap-2">
              {saving ? <Spinner className="h-4 w-4" /> : null}
              Register
            </Button>
          </div>
        </div>
      </Modal>

      {/* barcode-label generator dialog */}
      <Modal
        title="Generate barcode labels"
        onOpen={bcOpen}
        setOnOpen={() => setBcOpen(false)}
        footer={1}
        className="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-800">
              Fills each A4 sheet with{" "}
              <span className="font-semibold">{LABELS_PER_SHEET} labels</span>{" "}
              edge-to-edge (≈40 × 32&nbsp;mm each, minimal margins), dashed cut
              lines, and a unique EAN-13 barcode per label.{" "}
              <span className="font-semibold">Download A4 PDF</span> is
              recommended — the page is A4 inside the file, so the printer can’t
              shrink it to Folio/Long. When printing the PDF, keep scale at 100%
              (“Actual size”).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">
                Municipality
              </label>
              <Select
                value={bcMunicipality}
                onValueChange={setBcMunicipality}
                disabled={!lineMunicipality}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Loading from your line…" />
                </SelectTrigger>
                <SelectContent>
                  {lineMunicipality ? (
                    <SelectItem value={lineMunicipality}>
                      {lineMunicipality}
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Province
              </label>
              <Select
                value={bcProvince}
                onValueChange={setBcProvince}
                disabled={!lineProvince}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Loading from your line…" />
                </SelectTrigger>
                <SelectContent>
                  {lineProvince ? (
                    <SelectItem value={lineProvince}>{lineProvince}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="-mt-1 text-[11px] text-gray-500">
            Both come from your line&rsquo;s registered location and cannot be
            typed over.
          </p>

          <div>
            <label className="text-xs font-medium text-gray-700">
              Unit / Office / Department
            </label>
            <Select value={bcUnitId} onValueChange={setBcUnitId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select the office these labels are for…" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name ?? u.idCode ?? u.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-1/2">
            <label className="text-xs font-medium text-gray-700">
              Sheets (A4)
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={bcSheets}
              onChange={(e) => setBcSheets(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setBcOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={onPrintBarcodes} className="gap-2">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button onClick={onDownloadPdf} className="gap-2">
              <Download className="h-4 w-4" /> Download A4 PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Receiving;
