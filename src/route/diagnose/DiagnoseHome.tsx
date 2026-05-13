import { useState } from "react";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import zod from "zod";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PsgcRegion from "@/layout/PsgcRegion";
import PublicProvinceSelect from "@/layout/PublicProvinceSelect";
import PublicMunicipalSelect from "@/layout/PublicMunicipalSelect";
import PublicBarangaySelect from "@/layout/PublicBarangaySelect";
//icons
import {
  Search,
  UserRound,
  X,
  Loader2,
  Plus,
  Stethoscope,
  CalendarDays,
  Phone,
  MapPin,
  AlertCircle,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
//
import { AddDiagnoseSchema, NewPatientDiagnoseSchema } from "@/interface/zod";
import type { Patient, PatientRecordListProps } from "@/interface/data";
import { patientList, addPatient, addPatientRecord } from "@/db/statements/patient";

type AddDiagnoseFormProps = zod.infer<typeof AddDiagnoseSchema>;
type NewPatientDiagnoseFormProps = zod.infer<typeof NewPatientDiagnoseSchema>;

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

const DiagnoseHome = () => {
  const [mode, setMode] = useState<"search" | "new">("search");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch] = useDebounce(searchText, 400);

  // Duplicate detection state
  const [duplicateData, setDuplicateData] = useState<NewPatientDiagnoseFormProps | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<Patient[]>([]);

  const { lineId } = useParams();
  const auth = useAuth();
  const queryClient = useQueryClient();

  // Patient search query
  const { data: searchData, isFetching: isSearching } = useQuery<ListProps>({
    queryKey: ["patient-search-diagnose", lineId, debouncedSearch],
    queryFn: () =>
      patientList(auth.token as string, lineId as string, null, "8", debouncedSearch),
    enabled: !!debouncedSearch && mode === "search" && !selectedPatient,
    refetchOnWindowFocus: false,
  });
  const searchResults = searchData?.list ?? [];

  // Form: existing patient — diagnose only
  const existingForm = useForm<AddDiagnoseFormProps>({
    resolver: zodResolver(AddDiagnoseSchema),
    defaultValues: { diagnose: "" },
  });

  // Form: new patient + diagnose
  const newForm = useForm<NewPatientDiagnoseFormProps>({
    resolver: zodResolver(NewPatientDiagnoseSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      middlename: "",
      birthday: "",
      phoneNumber: "",
      email: "",
      region: "",
      province: "",
      municipal: "",
      barangay: "",
      diagnose: "",
    },
  });

  const {
    control: ec,
    handleSubmit: handleExisting,
    formState: { isSubmitting: isExistingSubmitting },
    reset: resetExisting,
  } = existingForm;

  const {
    control: nc,
    handleSubmit: handleNew,
    formState: { isSubmitting: isNewSubmitting },
    reset: resetNew,
    watch: watchNew,
  } = newForm;

  const regionId = watchNew("region");
  const provinceId = watchNew("province");
  const municipalId = watchNew("municipal");

  // Helper: increment _count.record in list cache for a patient
  const patchListRecord = (patientId: string) => {
    queryClient.setQueriesData<InfiniteData<ListProps>>(
      { queryKey: ["patient-list", lineId] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            list: page.list.map((p) =>
              p.id === patientId
                ? { ...p, _count: { record: (p._count?.record ?? 0) + 1 } }
                : p,
            ),
          })),
        };
      },
    );
  };

  // Submit: existing patient
  const onSubmitExisting = async (data: AddDiagnoseFormProps) => {
    if (!selectedPatient) return toast.error("Select a patient first.");
    try {
      const record = await addPatientRecord(auth.token as string, {
        patientId: selectedPatient.id,
        diagnose: data.diagnose,
      });
      // Update detail cache — increment _count
      queryClient.setQueryData<Patient>(
        ["patient-detail", selectedPatient.id],
        (old) =>
          old
            ? { ...old, _count: { record: (old._count?.record ?? 0) + 1 } }
            : old,
      );
      // Update patient-records infinite cache — prepend new record
      queryClient.setQueryData<InfiniteData<PatientRecordListProps>>(
        ["patient-records", selectedPatient.id],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === 0 ? { ...page, list: [record, ...page.list] } : page,
            ),
          };
        },
      );
      // Update list cache — increment _count
      patchListRecord(selectedPatient.id);
      toast.success("Diagnosis recorded successfully.");
      resetExisting();
      setSelectedPatient(null);
      setSearchText("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to record diagnosis.",
      );
    }
  };

  // Core save logic — called after duplicate check passes or user confirms
  const proceedWithNewPatient = async (data: NewPatientDiagnoseFormProps) => {
    const newPatient = await addPatient(auth.token as string, {
      firstname: data.firstname,
      lastname: data.lastname,
      middlename: data.middlename,
      birthday: data.birthday,
      phoneNumber: data.phoneNumber,
      email: data.email,
      regionId: data.region || undefined,
      provinceId: data.province || undefined,
      municipalId: data.municipal || undefined,
      barangayId: data.barangay || undefined,
      lineId: lineId as string,
    });
    await addPatientRecord(auth.token as string, {
      patientId: newPatient.id,
      diagnose: data.diagnose,
    });
    // Prepend to list cache with _count: { record: 1 }
    queryClient.setQueriesData<InfiniteData<ListProps>>(
      { queryKey: ["patient-list", lineId] },
      (old) => {
        if (!old) return old;
        const patient: Patient = { _count: { record: 1 }, ...newPatient };
        return {
          ...old,
          pages: old.pages.map((page, i) =>
            i === 0 ? { ...page, list: [patient, ...page.list] } : page,
          ),
        };
      },
    );
    toast.success("Patient registered and diagnosis recorded.");
    resetNew();
    setDuplicateData(null);
    setDuplicateMatches([]);
  };

  // Submit: new patient + diagnose — with duplicate check
  const onSubmitNew = async (data: NewPatientDiagnoseFormProps) => {
    try {
      // Check for existing patients with same first + last name
      const result = await patientList(
        auth.token as string,
        lineId as string,
        null,
        "20",
        `${data.firstname} ${data.lastname}`,
      );
      // Match: same first+last name (case-insensitive) AND same birthday if provided
      const matches = result.list.filter((p) => {
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
        // Duplicate found — pause and ask user
        setDuplicateData(data);
        setDuplicateMatches(matches);
        return;
      }

      await proceedWithNewPatient(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to register patient.",
      );
    }
  };

  // Called when user confirms "Save as New Person" from duplicate dialog
  const [isSavingDuplicate, setIsSavingDuplicate] = useState(false);
  const confirmSaveNew = async () => {
    if (!duplicateData) return;
    setIsSavingDuplicate(true);
    try {
      await proceedWithNewPatient(duplicateData);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to register patient.",
      );
    } finally {
      setIsSavingDuplicate(false);
    }
  };

  const switchMode = (next: "search" | "new") => {
    setMode(next);
    setSelectedPatient(null);
    setSearchText("");
  };

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">

      {/* ── Duplicate Patient Confirmation Dialog ── */}
      {duplicateData && (
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
                  A patient with the same name{duplicateData.birthday ? " and birthday" : ""} already exists.
                </p>
              </div>
              <button
                type="button"
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                onClick={() => { setDuplicateData(null); setDuplicateMatches([]); }}
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
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {p._count?.record ?? 0} existing record{(p._count?.record ?? 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => { setDuplicateData(null); setDuplicateMatches([]); }}
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

      <div className="p-3">
        {/* Single FormProvider for newForm — both panels share one context to avoid focus loss */}
        <Form {...newForm}>
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
                      Search existing or register new
                    </p>
                  </div>
                </div>
                {/* Mode toggle */}
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-md p-0.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => switchMode("search")}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      mode === "search"
                        ? "bg-white text-blue-600 font-medium shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("new")}
                    className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                      mode === "new"
                        ? "bg-white text-blue-600 font-medium shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3">
              {mode === "search" ? (
                <div className="space-y-2">
                  {/* Search input */}
                  {!selectedPatient && (
                    <div className="space-y-2">
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

                      {/* Results */}
                      {debouncedSearch && searchResults.length > 0 && (
                        <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
                          {searchResults.map((patient) => {
                            const fullName = [
                              patient.firstname,
                              patient.middlename,
                              patient.lastname,
                            ]
                              .filter((s) => s && s !== "N/A")
                              .join(" ");
                            const age = patient.birthday
                              ? calculateAge(patient.birthday)
                              : null;
                            return (
                              <button
                                key={patient.id}
                                type="button"
                                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 transition-colors text-left group"
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setSearchText("");
                                }}
                              >
                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100">
                                  <UserRound className="h-3 w-3 text-gray-500 group-hover:text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {fullName}
                                  </p>
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
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Try a different name or switch to New
                          </p>
                        </div>
                      )}

                      {!debouncedSearch && (
                        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-center">
                          <Search className="h-6 w-6 text-gray-300 mb-1.5" />
                          <p className="text-xs text-gray-500">Search a patient</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Type a name to find existing records
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected patient card */}
                  {selectedPatient && (
                    <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                            <UserRound className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900">
                              {[
                                selectedPatient.firstname,
                                selectedPatient.middlename,
                                selectedPatient.lastname,
                              ]
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
                                {[
                                  selectedPatient.barangay?.name,
                                  selectedPatient.municipal?.name,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {selectedPatient._count?.record ?? 0} existing record
                              {(selectedPatient._count?.record ?? 0) !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 text-gray-400 hover:text-gray-700 flex-shrink-0"
                          onClick={() => setSelectedPatient(null)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── New Patient Form ── */
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={nc}
                        name="firstname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">
                              First Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Juan"
                                className="h-8 text-xs"
                                disabled={isNewSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={nc}
                        name="lastname"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">
                              Last Name *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="dela Cruz"
                                className="h-8 text-xs"
                                disabled={isNewSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={nc}
                      name="middlename"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold text-gray-700">
                            Middle Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Santos"
                              className="h-8 text-xs"
                              disabled={isNewSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={nc}
                        name="birthday"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">
                              Birthday
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="h-8 text-xs"
                                disabled={isNewSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={nc}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-semibold text-gray-700">
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="09XX XXX XXXX"
                                className="h-8 text-xs"
                                disabled={isNewSubmitting}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={nc}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold text-gray-700">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="patient@email.com"
                              className="h-8 text-xs"
                              disabled={isNewSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-1" />

                    {/* Location */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <p className="text-[10px] font-semibold text-gray-700">
                          Location (Optional)
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={nc}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-semibold text-gray-700">
                                Region
                              </FormLabel>
                              <FormControl>
                                <PsgcRegion
                                  onChange={field.onChange}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={nc}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-semibold text-gray-700">
                                Province
                              </FormLabel>
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
                          control={nc}
                          name="municipal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-semibold text-gray-700">
                                Municipality
                              </FormLabel>
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
                          control={nc}
                          name="barangay"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] font-semibold text-gray-700">
                                Barangay
                              </FormLabel>
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
              )}
            </div>
          </div>

          {/* ── Diagnosis Panel ── */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50">
              <div className="flex items-center gap-1.5">
                <Stethoscope className="h-3 w-3 text-blue-500" />
                <div>
                  <h3 className="text-xs font-semibold text-gray-800">Diagnosis</h3>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    Record findings for this visit
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3">
              {mode === "search" ? (
                <Form {...existingForm}>
                  <div className="space-y-3">
                    <FormField
                      control={ec}
                      name="diagnose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold text-gray-700">
                            Diagnosis *
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter diagnosis, symptoms, or findings..."
                              className="text-xs min-h-[120px] resize-none"
                              disabled={isExistingSubmitting || !selectedPatient}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!selectedPatient && (
                      <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-md">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700">
                          Search and select a patient before submitting.
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full h-8 gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      disabled={isExistingSubmitting || !selectedPatient}
                      onClick={handleExisting(onSubmitExisting)}
                    >
                      {isExistingSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Recording...
                        </>
                      ) : (
                        <>
                          <Stethoscope className="h-3.5 w-3.5" />
                          Record Diagnosis
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              ) : (
                <div className="space-y-3">
                    <FormField
                      control={nc}
                      name="diagnose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px] font-semibold text-gray-700">
                            Diagnosis *
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter diagnosis, symptoms, or findings..."
                              className="text-xs min-h-[120px] resize-none"
                              disabled={isNewSubmitting}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
                      <AlertCircle className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-blue-700">
                        A new patient record will be created along with this diagnosis.
                      </p>
                    </div>

                    <Button
                      className="w-full h-8 gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                      disabled={isNewSubmitting}
                      onClick={handleNew(onSubmitNew)}
                    >
                      {isNewSubmitting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" />
                          Register & Record Diagnosis
                        </>
                      )}
                    </Button>
                  </div>
              )}
            </div>
          </div>

        </div>
        </Form>
      </div>
    </div>
  );
};

export default DiagnoseHome;
