import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
//icons
import {
  Loader2,
  ClipboardList,
  Stethoscope,
  ClipboardCheck,
  Pill,
  UserRound,
  CalendarDays,
  Phone,
  MapPin,
  FileText,
  Hash,
  Building2,
  User as UserIcon,
} from "lucide-react";
//
import type { PatientRecord, MedicineTransaction, Patient } from "@/interface/data";
import { patientRecordData } from "@/db/statements/patient";

interface MedicineTransactionItemFull {
  id: string;
  prescribeQuantity?: number | null;
  releasedQuantity?: number | null;
  medicine?: { id: string; name: string; serialNumber: string } | null;
  storage?: { id: string; name: string } | null;
}

interface MedicineTransactionFull extends MedicineTransaction {
  MedicineTransactionItem?: MedicineTransactionItemFull[];
  prescription?: {
    id: string;
    refNumber: string;
    condtion?: string | null;
    street?: string | null;
    timestamp: string;
  } | null;
}

interface PresMedSummary {
  id: string;
  quantity: number;
  desc?: string | null;
  medicine?: { id: string; name: string; serialNumber: string } | null;
}

interface PrescriptionFull {
  id: string;
  refNumber: string;
  status: number;
  timestamp: string;
  condtion?: string | null;
  presMed?: PresMedSummary[];
  MedicineTransaction?: MedicineTransactionFull[];
}

interface PatientRecordFull extends Omit<PatientRecord, "patient" | "medicineTransaction"> {
  patient?: Patient | null;
  prescription?: PrescriptionFull | null;
  medicineTransaction?: MedicineTransactionFull | null;
}

const recordMeta: Record<
  number,
  { label: string; icon: React.ElementType; bg: string; fg: string; ring: string }
> = {
  0: { label: "Diagnosis",         icon: Stethoscope,    bg: "bg-purple-100", fg: "text-purple-700", ring: "ring-purple-200" },
  1: { label: "Prescribed",        icon: ClipboardCheck, bg: "bg-blue-100",   fg: "text-blue-700",   ring: "ring-blue-200"   },
  2: { label: "Medicine Received", icon: Pill,           bg: "bg-green-100",  fg: "text-green-700",  ring: "ring-green-200"  },
};

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const calculateAge = (birthday?: string | null): number | null => {
  if (!birthday) return null;
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const PatientRecordDetail = () => {
  const { recordId } = useParams();
  const auth = useAuth();

  const { data, isFetching, isError } = useQuery<PatientRecordFull>({
    queryKey: ["patient-record-detail", recordId],
    queryFn: () => patientRecordData(auth.token as string, recordId as string),
    enabled: !!recordId && !!auth.token,
    refetchOnWindowFocus: false,
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <p className="text-xs text-gray-500">Loading record...</p>
      </div>
    );
  }

  // ── Not Found / Error ──────────────────────────────────────────────────────
  if (!data || isError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <div className="bg-gray-100 rounded-full p-3">
          <ClipboardList className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 font-medium">Record not found</p>
      </div>
    );
  }

  const meta = recordMeta[data.type] ?? recordMeta[0];
  const Icon = meta.icon;
  const patient = data.patient;

  // For type=2 records the transaction comes from the record directly.
  // For type=1 records (Prescribed), look up the dispense transaction via the
  // linked Prescription so we can show the dispense info if it already happened.
  const tx =
    data.medicineTransaction ??
    data.prescription?.MedicineTransaction?.[0] ??
    null;
  const items = tx?.MedicineTransactionItem ?? [];
  const prescription = data.prescription ?? null;
  const isDispensed = prescription ? prescription.status === 2 : !!tx;

  const fullName = patient
    ? [patient.firstname, patient.middlename, patient.lastname]
        .filter((s) => s && s !== "N/A")
        .join(" ")
    : "Unknown Patient";

  const address = patient
    ? [
        patient.barangay?.name,
        patient.municipal?.name,
        patient.province?.name,
        patient.region?.name,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 space-y-3">

        {/* Record ID */}
        <p className="text-[10px] text-gray-400 font-mono truncate">ID: {data.id.slice(-8)}</p>

        {/* ── Record header ── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="p-3 flex items-start gap-3">
            <div className={`h-10 w-10 rounded-full ring-4 flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.ring}`}>
              <Icon className={`h-5 w-5 ${meta.fg}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm font-bold text-gray-900">{meta.label}</h1>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Record Entry
                </Badge>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                <CalendarDays className="h-2.5 w-2.5" />
                {formatDateTime(data.timestamp)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Patient summary ── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <UserRound className="h-3 w-3 text-blue-500" />
            <h3 className="text-xs font-semibold text-gray-800">Patient</h3>
          </div>
          <div className="p-3 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="text-[10px] text-gray-500">Name</p>
              <p className="text-xs font-medium text-gray-900">{fullName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Age / Birthday</p>
              <p className="text-xs font-medium text-gray-800">
                {patient?.birthday ? (
                  <>
                    {calculateAge(patient.birthday)} yrs
                    <span className="text-[10px] text-gray-400 ml-1">
                      ({new Date(patient.birthday).toLocaleDateString("en-PH", {
                        year: "numeric", month: "short", day: "numeric",
                      })})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">Not recorded</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <Phone className="h-2.5 w-2.5" /> Phone
              </p>
              <p className="text-xs font-medium text-gray-800">
                {patient?.phoneNumber || <span className="text-gray-400">Not recorded</span>}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" /> Address
              </p>
              <p className="text-xs font-medium text-gray-800">
                {address || <span className="text-gray-400">Not recorded</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ── Notes / Diagnosis ── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <FileText className="h-3 w-3 text-blue-500" />
            <h3 className="text-xs font-semibold text-gray-800">
              {data.type === 0 ? "Diagnosis" : "Notes / Condition"}
            </h3>
          </div>
          <div className="p-3">
            {data.diagnose ? (
              <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                {data.diagnose}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">No notes recorded for this entry.</p>
            )}
          </div>
        </div>

        {/* ── Prescription summary (for type=1 records) ── */}
        {data.type === 1 && prescription && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ClipboardCheck className="h-3 w-3 text-blue-600" />
                <h3 className="text-xs font-semibold text-gray-800">Prescribed Medicines</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <code className="text-[10px] font-mono font-semibold text-blue-700">
                  {prescription.refNumber}
                </code>
                <Badge
                  variant={isDispensed ? "default" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  {isDispensed ? "Dispensed" : "Pending"}
                </Badge>
              </div>
            </div>
            {prescription.presMed && prescription.presMed.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {prescription.presMed.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2.5 px-3 py-2">
                    <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {m.medicine?.name ?? "Unknown medicine"}
                      </p>
                      {m.medicine?.serialNumber && (
                        <p className="text-[10px] text-gray-400 truncate font-mono">
                          {m.medicine.serialNumber}
                        </p>
                      )}
                      {m.desc && (
                        <p className="text-[10px] text-gray-500 truncate">{m.desc}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      ×{m.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <p className="text-xs text-gray-400">No medicines listed.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Dispensing Transaction ── */}
        {tx && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Pill className="h-3 w-3 text-green-600" />
                <h3 className="text-xs font-semibold text-gray-800">Medicines Dispensed</h3>
              </div>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Transaction meta */}
            <div className="px-3 py-2 border-b bg-white grid grid-cols-2 gap-2">
              {tx.prescription?.refNumber && (
                <div>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Hash className="h-2.5 w-2.5" /> Prescription Ref.
                  </p>
                  <code className="text-xs font-mono font-semibold text-blue-700">
                    {tx.prescription.refNumber}
                  </code>
                </div>
              )}
              <div>
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <CalendarDays className="h-2.5 w-2.5" /> Dispensed On
                </p>
                <p className="text-xs font-medium text-gray-800">
                  {formatDateTime(tx.timestamp)}
                </p>
              </div>
              {tx.user && (
                <div>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <UserIcon className="h-2.5 w-2.5" /> Dispensed By
                  </p>
                  <p className="text-xs font-medium text-gray-800">
                    {[tx.user.lastName, tx.user.firstName].filter(Boolean).join(", ") ||
                      tx.user.username}
                  </p>
                </div>
              )}
              {tx.storage?.name && (
                <div>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Building2 className="h-2.5 w-2.5" /> Source Storage
                  </p>
                  <p className="text-xs font-medium text-gray-800">{tx.storage.name}</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Items list */}
            {items.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {item.medicine?.name ?? "Unknown medicine"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {item.medicine?.serialNumber && (
                          <span className="font-mono">{item.medicine.serialNumber}</span>
                        )}
                        {item.storage?.name && (
                          <span> · From: {item.storage.name}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-gray-500">Released</p>
                      <p className="text-xs font-semibold text-gray-900">
                        {item.releasedQuantity ?? 0}
                        {item.prescribeQuantity != null && item.prescribeQuantity !== item.releasedQuantity && (
                          <span className="text-[10px] text-gray-400 ml-1">
                            / {item.prescribeQuantity} prescribed
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center">
                <Pill className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">No medicine items in this transaction.</p>
              </div>
            )}
          </div>
        )}

        {/* ── No transaction note (for type 1 records still pending) ── */}
        {!tx && data.type === 1 && !isDispensed && (
          <div className="border border-dashed rounded-lg bg-white p-4 text-center">
            <ClipboardCheck className="h-6 w-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-500 font-medium">
              Prescription submitted — medicines not yet dispensed
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              A separate "Medicine Received" record will appear once dispensed.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default PatientRecordDetail;
