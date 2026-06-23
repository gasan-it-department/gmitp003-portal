import { useRef, useState } from "react";
import { toast } from "sonner";

import { useAdminAuth } from "@/provider/AdminRouter";
import { downloadBackup, importBackup } from "@/db/statement";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DatabaseBackup,
  Download,
  Upload,
  Loader2,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

interface ImportSummaryRow {
  model: string;
  rows: number;
  inserted: number;
  skipped: number;
}
interface ImportResult {
  inserted: number;
  skipped: number;
  models: number;
  summary: ImportSummaryRow[];
}

const Backup = () => {
  const { token } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onExport = async () => {
    setExporting(true);
    try {
      await downloadBackup(token);
      toast.success("Backup downloaded");
    } catch (e) {
      toast.error("Backup failed", { description: `${e}` });
    } finally {
      setExporting(false);
    }
  };

  const onPickFile = () => fileRef.current?.click();

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON.");
      }
      const res = (await importBackup(token, parsed)) as ImportResult;
      setResult(res);
      toast.success(
        `Import complete — ${res.inserted} new, ${res.skipped} skipped`,
      );
    } catch (e: any) {
      const msg = e?.response?.data?.message || `${e}`;
      toast.error("Import failed", { description: msg });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="w-full h-full p-3 md:p-5">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-600">
            <DatabaseBackup className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Backup &amp; Restore
            </h2>
            <p className="text-[11px] text-gray-500">
              Export the whole database to JSON, or restore one back in.
            </p>
          </div>
        </div>

        {/* Export */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 flex-none">
              <Download className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                Export all data
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Downloads every table as a single timestamped JSON file.
              </p>
            </div>
            <Button
              size="sm"
              onClick={onExport}
              disabled={exporting}
              className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download backup
            </Button>
          </div>
        </div>

        {/* Import */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 flex-none">
              <Upload className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                Import / restore
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Adds rows from a backup file. Records that already exist (same
                id) are <span className="font-medium">skipped</span> — nothing is
                overwritten or deleted.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={onPickFile}
              disabled={importing}
              className="h-9 gap-1.5 bg-white"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Choose backup file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onFileChosen}
            />
          </div>

          {/* Result */}
          {result && (
            <div className="mt-3 rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-gray-800">
                  Restored
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  +{result.inserted} new
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {result.skipped} skipped
                </Badge>
              </div>
              {result.summary.length > 0 ? (
                <div className="max-h-48 overflow-auto divide-y">
                  {result.summary.map((s) => (
                    <div
                      key={s.model}
                      className="flex items-center justify-between py-1 text-[11px]"
                    >
                      <span className="text-gray-700">{s.model}</span>
                      <span className="text-gray-500">
                        +{s.inserted}
                        {s.skipped > 0 && (
                          <span className="text-gray-400">
                            {" "}
                            ({s.skipped} skipped)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-gray-500">
                  Nothing new to add — everything in the file already exists.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 p-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-500 flex-none mt-0.5" />
          <p className="text-[11px] text-amber-700">
            The backup file contains the entire database (including sensitive
            data). Store it securely. Import only restores missing records — it
            never deletes or overwrites existing ones.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Backup;
