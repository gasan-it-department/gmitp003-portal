import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
//
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PsgcRegion from "@/layout/PsgcRegion";
import PublicProvinceSelect from "@/layout/PublicProvinceSelect";
import PublicMunicipalSelect from "@/layout/PublicMunicipalSelect";
import PublicBarangaySelect from "@/layout/PublicBarangaySelect";
import DispensaryPrescribe from "@/layout/medicine/DispensaryPrescribe";
//icons
import {
  UserRound,
  Search,
  X,
  Loader2,
  Plus,
  Pill,
  Send,
  Trash2,
  CalendarDays,
  Phone,
  MapPin,
  ClipboardCheck,
  AlertCircle,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
//
import { DispensarySchema } from "@/interface/zod";
import type { DispensaryProps, Patient } from "@/interface/data";
import { patientList } from "@/db/statements/patient";
import { createPrescription } from "@/db/statements/prescription";

type DispensaryFormProps = DispensaryProps;

interface ListProps {
  list: Patient[];
  hasMore: boolean;
  lastCursor: string | null;
}

const calculateAge = (birthday: string): number => {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const DispensaryOut = () => {
  const { lineId } = useParams();
  const auth = useAuth();

  // Patient panel state
  const [patientMode, setPatientMode] = useState<"search" | "manual">("search");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch] = useDebounce(searchText, 400);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingData, setPendingData] = useState<DispensaryFormProps | null>(null);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  // Duplicate-patient detection state (manual mode only)
  const [duplicateMatches, setDuplicateMatches] = useState<Patient[]>([]);
  const [isSavingDuplicate, setIsSavingDuplicate] = useState(false);

  // Success state
  const [successInfo, setSuccessInfo] = useState<{
    refNumber: string;
    firstname: string;
    lastname: string;
  } | null>(null);

  // Form
  const form = useForm<DispensaryFormProps>({
    resolver: zodResolver(DispensarySchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      birthday: "",
      phoneNumber: "",
      email: "",
      region: "",
      province: "",
      municipal: "",
      barangay: "",
      street: "",
      desc: "",
      patientId: "",
      prescribeMed: [],
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const regionId = watch("region");
  const provinceId = watch("province");
  const municipalId = watch("municipal");

  const prescribeMeds = useFieldArray({ control, name: "prescribeMed" });

  // Patient search
  const { data: searchData, isFetching: isSearching } = useQuery<ListProps>({
    queryKey: ["patient-search-prescribe", lineId, debouncedSearch],
    queryFn: () =>
      patientList(auth.token as string, lineId as string, null, "8", debouncedSearch),
    enabled: !!debouncedSearch && patientMode === "search" && !selectedPatient,
    refetchOnWindowFocus: false,
  });
  const searchResults = searchData?.list ?? [];

  // Select patient from search
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchText("");
    setValue("firstname", patient.firstname);
    setValue("lastname", patient.lastname);
    setValue("patientId", patient.id);
    setValue("birthday", patient.birthday ? new Date(patient.birthday).toISOString().substring(0, 10) : "");
  };

  // Switch patient mode
  const switchMode = (next: "search" | "manual") => {
    setPatientMode(next);
    setSelectedPatient(null);
    setSearchText("");
    setValue("firstname", "");
    setValue("lastname", "");
    setValue("birthday", "");
    setValue("phoneNumber", "");
    setValue("email", "");
    setValue("patientId", "");
  };

  // Add medicine
  const handleAddPresMed = (
    medId: string,
    comment: string,
    quantity: string,
    medName: string,
  ) => {
    const existed = prescribeMeds.fields.findIndex((item) => item.medId === medId);
    if (existed !== -1) return;
    if (quantity === "0") {
      toast.warning("Invalid quantity");
      return;
    }
    prescribeMeds.append({ medId, comment, quantity, medName });
    toast.success(`${medName} added`);
  };

  // Open confirm dialog after validation
  const onValidSubmit = (data: DispensaryFormProps) => {
    setPendingData(data);
    setConfirmOpen(true);
  };

  // Core save logic — runs the actual prescription API call
  const performSubmit = async (data: DispensaryFormProps) => {
    const barangayId =
      patientMode === "search" ? selectedPatient?.barangayId ?? undefined : data.barangay || undefined;
    const municipalId =
      patientMode === "search" ? selectedPatient?.municipalId ?? undefined : data.municipal || undefined;
    const provinceId =
      patientMode === "search" ? selectedPatient?.provinceId ?? undefined : data.province || undefined;

    const result = await createPrescription(auth.token as string, {
      lineId: lineId as string,
      userId: auth.userId as string,
      firstname: data.firstname,
      lastname: data.lastname,
      birthday: data.birthday || undefined,
      phoneNumber: patientMode === "manual" ? data.phoneNumber || undefined : undefined,
      email: patientMode === "manual" ? data.email || undefined : undefined,
      barangayId,
      municipalId,
      provinceId,
      street: data.street || undefined,
      desc: data.desc || undefined,
      patientId: data.patientId || undefined,
      prescribeMed: data.prescribeMed.map((m) => ({
        medId: m.medId,
        comment: m.comment,
        quantity: m.quantity,
      })),
    });

    setSuccessInfo({
      refNumber: result.refNumber,
      firstname: data.firstname,
      lastname: data.lastname,
    });

    reset();
    setSelectedPatient(null);
    setSearchText("");
    setPatientMode("search");
    setConfirmOpen(false);
    setPendingData(null);
    setDuplicateMatches([]);
  };

  // Submit button inside the confirmation dialog
  const doSubmit = async () => {
    if (!pendingData) return;
    const data = pendingData;
    setIsConfirmSubmitting(true);

    try {
      // In manual mode (no patientId selected), check for similar existing patients
      // by first+last name and (if provided) birthday.
      if (patientMode === "manual" && !data.patientId) {
        const result = await patientList(
          auth.token as string,
          lineId as string,
          null,
          "20",
          `${data.firstname} ${data.lastname}`,
        );
        const matches = result.list.filter((p: Patient) => {
          const nameMatch =
            p.firstname?.toLowerCase() === data.firstname.toLowerCase() &&
            p.lastname?.toLowerCase() === data.lastname.toLowerCase();
          if (!nameMatch) return false;
          if (data.birthday && p.birthday) {
            return p.birthday.startsWith(data.birthday.substring(0, 10));
          }
          return true;
        });

        if (matches.length > 0) {
          // Pause and ask user whether this is truly a different person
          setDuplicateMatches(matches);
          setConfirmOpen(false);
          return; // keep pendingData; the duplicate dialog handles the next step
        }
      }

      await performSubmit(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit prescription.");
      setConfirmOpen(false);
    } finally {
      setIsConfirmSubmitting(false);
    }
  };

  // User clicked "Save as New Person" from the duplicate-patient dialog
  const confirmSaveNew = async () => {
    if (!pendingData) return;
    setIsSavingDuplicate(true);
    try {
      await performSubmit(pendingData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit prescription.");
    } finally {
      setIsSavingDuplicate(false);
    }
  };

  // Cancel the duplicate dialog and drop the pending submission
  const cancelDuplicate = () => {
    setDuplicateMatches([]);
    setPendingData(null);
  };

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">

      {/* ── Confirmation Dialog ── */}
      {confirmOpen && pendingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b bg-blue-50 flex items-start gap-2.5">
              <div className="p-1.5 bg-blue-100 rounded-md flex-shrink-0">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Confirm Prescription</h3>
                <p className="text-[10px] text-blue-700 mt-0.5">
                  Review details before submitting
                </p>
              </div>
              <button
                type="button"
                className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"
                onClick={() => setConfirmOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <UserRound className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {pendingData.lastname}, {pendingData.firstname}
                  </p>
                  {pendingData.birthday && (
                    <p className="text-[10px] text-gray-400">
                      {calculateAge(pendingData.birthday)} yrs old · {new Date(pendingData.birthday).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Medicines ({pendingData.prescribeMed.length})
                </p>
                {pendingData.prescribeMed.map((m, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 bg-gray-50 rounded border border-gray-100">
                    <p className="text-[10px] font-medium text-gray-700 truncate">{m.medName}</p>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0 ml-2">
                      ×{m.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
              {pendingData.desc && (
                <div className="p-2 bg-gray-50 border border-gray-100 rounded-lg">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Notes</p>
                  <p className="text-[10px] text-gray-700">{pendingData.desc}</p>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={doSubmit}
                disabled={isConfirmSubmitting}
              >
                {isConfirmSubmitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Submitting...</>
                ) : (
                  <><Send className="h-3.5 w-3.5" />Submit</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Patient Warning Dialog ── */}
      {duplicateMatches.length > 0 && pendingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="px-4 py-3 border-b bg-amber-50 flex items-start gap-2.5">
              <div className="p-1.5 bg-amber-100 rounded-md flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Similar Patient Found
                </h3>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  A patient with the same name{pendingData.birthday ? " and birthday" : ""} already exists.
                </p>
              </div>
              <button
                type="button"
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                onClick={cancelDuplicate}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Matches list */}
            <div className="px-4 py-3 space-y-2 max-h-52 overflow-y-auto">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                Existing Record{duplicateMatches.length > 1 ? "s" : ""}
              </p>
              {duplicateMatches.map((p) => {
                const fullName = [p.firstname, p.middlename, p.lastname]
                  .filter((s) => s && s !== "N/A")
                  .join(" ");
                const age = p.birthday ? calculateAge(p.birthday) : null;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-100 rounded-lg"
                  >
                    <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {age !== null && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <CalendarDays className="h-2.5 w-2.5" />{age} yrs
                          </span>
                        )}
                        {p.phoneNumber && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <Phone className="h-2.5 w-2.5" />{p.phoneNumber}
                          </span>
                        )}
                        {(p.barangay || p.municipal) && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            {[p.barangay?.name, p.municipal?.name].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-gray-500 mt-1">
                If this is the <strong>same</strong> person, cancel and use{" "}
                <span className="font-medium text-blue-600">Search</span> mode to link to their record.
                Otherwise continue to save as a new person.
              </p>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={cancelDuplicate}
                disabled={isSavingDuplicate}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={confirmSaveNew}
                disabled={isSavingDuplicate}
              >
                {isSavingDuplicate ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Save as New Person
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Dialog ── */}
      {successInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b bg-green-50 flex items-start gap-2.5">
              <div className="p-1.5 bg-green-100 rounded-md flex-shrink-0">
                <ClipboardCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Prescription Submitted</h3>
                <p className="text-[10px] text-green-700 mt-0.5">
                  Record has been saved successfully
                </p>
              </div>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs font-medium text-gray-600">Reference #</span>
                <code className="font-mono font-bold text-blue-700 text-sm">{successInfo.refNumber}</code>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <p className="text-[10px] text-gray-500">Patient</p>
                  <p className="text-xs font-medium text-gray-800 mt-0.5">
                    {successInfo.lastname}, {successInfo.firstname}
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-100">
                  <p className="text-[10px] text-gray-500">Status</p>
                  <Badge variant="default" className="mt-0.5 text-[10px] px-1.5 py-0">
                    Pending
                  </Badge>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center">
                You can view this in the Transactions tab
              </p>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50">
              <Button
                size="sm"
                className="w-full h-8 text-xs"
                variant="outline"
                onClick={() => setSuccessInfo(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <Form {...form}>
      <div className="p-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">

          {/* ── Patient Panel ── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <UserRound className="h-3 w-3 text-blue-500" />
                  <div>
                    <h3 className="text-xs font-semibold text-gray-800">Patient</h3>
                    <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                      Search existing or fill manually
                    </p>
                  </div>
                </div>
                {/* Mode toggle */}
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => switchMode("search")}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      patientMode === "search"
                        ? "bg-white text-blue-600 font-medium shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("manual")}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      patientMode === "manual"
                        ? "bg-white text-blue-600 font-medium shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Manual
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* ── Search Mode ── */}
              {patientMode === "search" && (
                <div className="space-y-2">
                  {!selectedPatient ? (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                        {isSearching && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 animate-spin" />
                        )}
                        <Input
                          placeholder="Search by name..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="pl-7 h-8 text-xs"
                        />
                      </div>
                      {debouncedSearch && searchResults.length > 0 && (
                        <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
                          {searchResults.map((patient) => {
                            const fullName = [patient.firstname, patient.middlename, patient.lastname]
                              .filter((s) => s && s !== "N/A")
                              .join(" ");
                            const age = patient.birthday ? calculateAge(patient.birthday) : null;
                            return (
                              <button
                                key={patient.id}
                                type="button"
                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 transition-colors text-left group"
                                onClick={() => handleSelectPatient(patient)}
                              >
                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100">
                                  <UserRound className="h-3 w-3 text-gray-500 group-hover:text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{fullName}</p>
                                  <p className="text-[10px] text-gray-400">
                                    {age ? `${age} yrs` : ""}
                                    {age && patient.phoneNumber ? " · " : ""}
                                    {patient.phoneNumber ?? ""}
                                  </p>
                                </div>
                                <Badge
                                  variant={patient.illi ? "destructive" : "default"}
                                  className="text-[10px] px-1.5 py-0 flex-shrink-0"
                                >
                                  {patient.illi ? "Ill" : "Active"}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {debouncedSearch && !isSearching && searchResults.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg text-center">
                          <UserRound className="h-6 w-6 text-gray-300 mb-1.5" />
                          <p className="text-xs text-gray-500">No patients found</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Try a different name or switch to Manual</p>
                        </div>
                      )}
                      {!debouncedSearch && (
                        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-center">
                          <Search className="h-6 w-6 text-gray-300 mb-1.5" />
                          <p className="text-xs text-gray-500">Search a patient</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Type to find existing records</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                            <UserRound className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900">
                              {[selectedPatient.firstname, selectedPatient.middlename, selectedPatient.lastname]
                                .filter((s) => s && s !== "N/A")
                                .join(" ")}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <Badge
                                variant={selectedPatient.illi ? "destructive" : "default"}
                                className="text-[10px] px-1.5 py-0"
                              >
                                {selectedPatient.illi ? "Ill" : "Active"}
                              </Badge>
                              {selectedPatient.birthday && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <CalendarDays className="h-2.5 w-2.5" />
                                  {calculateAge(selectedPatient.birthday)} yrs
                                </span>
                              )}
                              {selectedPatient.phoneNumber && (
                                <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                  <Phone className="h-2.5 w-2.5" />
                                  {selectedPatient.phoneNumber}
                                </span>
                              )}
                            </div>
                            {(selectedPatient.barangay || selectedPatient.municipal) && (
                              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {[selectedPatient.barangay?.name, selectedPatient.municipal?.name]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          className="h-5 w-5 p-0 text-gray-400 hover:text-gray-700 flex-shrink-0"
                          onClick={() => {
                            setSelectedPatient(null);
                            setValue("firstname", "");
                            setValue("lastname", "");
                            setValue("birthday", "");
                            setValue("patientId", "");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Name + Birthday fields (search mode) */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={control}
                        name="firstname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">First Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Juan"
                                className="h-8 text-xs"
                                disabled={!!selectedPatient}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="lastname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">Last Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="dela Cruz"
                                className="h-8 text-xs"
                                disabled={!!selectedPatient}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={control}
                      name="birthday"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold text-gray-700">
                            Birthday
                            {field.value && (
                              <span className="ml-1.5 font-normal text-gray-400">
                                ({calculateAge(field.value)} yrs old)
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="h-8 text-xs w-44"
                              disabled={!!selectedPatient}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* ── Manual Mode ── */}
              {patientMode === "manual" && (
                <div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={control}
                        name="firstname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan" className="h-8 text-xs" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="lastname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="dela Cruz" className="h-8 text-xs" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={control}
                        name="birthday"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">
                              Birthday
                              {field.value && (
                                <span className="ml-1.5 font-normal text-gray-400">
                                  ({calculateAge(field.value)} yrs old)
                                </span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input type="date" className="h-8 text-xs" {...field} />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="09XX XXX XXXX"
                                className="h-8 text-xs"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold text-gray-700">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="patient@email.com"
                              className="h-8 text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-[10px]" />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-1" />

                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <p className="text-[10px] font-semibold text-gray-700">Location (Optional)</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-semibold text-gray-700">Region</FormLabel>
                              <FormControl>
                                <PsgcRegion onChange={field.onChange} value={field.value ?? ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-semibold text-gray-700">Province</FormLabel>
                              <FormControl>
                                <PublicProvinceSelect
                                  onChange={field.onChange}
                                  regionId={regionId}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="municipal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-semibold text-gray-700">Municipality</FormLabel>
                              <FormControl>
                                <PublicMunicipalSelect
                                  provinceId={provinceId}
                                  onChange={field.onChange}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="barangay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-semibold text-gray-700">Barangay</FormLabel>
                              <FormControl>
                                <PublicBarangaySelect
                                  municipalityId={municipalId}
                                  onChange={field.onChange}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Description (both modes) ── */}
              <div>
                <Separator className="my-1" />
                <FormField
                  control={control}
                  name="desc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        Notes / Condition (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter patient condition, diagnosis, or additional notes..."
                          className="text-xs min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* ── Medicines Panel ── */}
          <div className="border rounded-lg bg-white overflow-hidden flex flex-col">
            {/* Available medicines picker */}
            <div className="border-b bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Pill className="h-3 w-3 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Available Medicines</h3>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Click a medicine to add to prescription
                  </p>
                </div>
              </div>
            </div>
            <div className="h-80 overflow-hidden border-b">
              <DispensaryPrescribe
                handleAddPresMed={handleAddPresMed}
                lineId={lineId}
                storageId={undefined}
                token={auth.token}
              />
            </div>

            {/* Selected medicines */}
            <div className="border-b bg-gray-50 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ClipboardCheck className="h-3 w-3 text-green-500" />
                <h3 className="text-xs font-semibold text-gray-800">
                  Selected
                </h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {prescribeMeds.fields.length}
                </Badge>
              </div>
              {errors.prescribeMed && (
                <div className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <p className="text-[10px]">{errors.prescribeMed.message}</p>
                </div>
              )}
            </div>

            <div className="min-h-[100px] max-h-48 overflow-auto">
              {prescribeMeds.fields.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {prescribeMeds.fields.map((item, i) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-[10px] font-medium text-green-600">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.medName}</p>
                        {item.comment && (
                          <p className="text-[10px] text-gray-400 truncate">{item.comment}</p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                        ×{item.quantity}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        className="h-5 w-5 p-0 text-gray-300 hover:text-red-500 flex-shrink-0"
                        onClick={() => prescribeMeds.remove(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Pill className="h-6 w-6 text-gray-300 mb-1.5" />
                  <p className="text-xs text-gray-400">No medicines added</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">Select from the list above</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="px-3 py-2.5 border-t bg-gray-50">
              {patientMode === "search" && !selectedPatient && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-md mb-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700">
                    Search and select a patient first, or switch to Manual mode.
                  </p>
                </div>
              )}
              <Button
                className="w-full h-8 gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={
                  prescribeMeds.fields.length === 0 ||
                  (patientMode === "search" && !selectedPatient)
                }
                onClick={handleSubmit(onValidSubmit)}
                type="button"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Prescription ({prescribeMeds.fields.length} medicine{prescribeMeds.fields.length !== 1 ? "s" : ""})
              </Button>
            </div>
          </div>

        </div>
      </div>
      </Form>
    </div>
  );
};

export default DispensaryOut;
