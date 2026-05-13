import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import {
  useQuery,
  useQueryClient,
  useMutation,
  type InfiniteData,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import zod from "zod";
import { toast } from "sonner";
//
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import PatientRecords from "@/layout/patients/PatientRecords";
import PsgcRegion from "@/layout/PsgcRegion";
import PublicProvinceSelect from "@/layout/PublicProvinceSelect";
import PublicMunicipalSelect from "@/layout/PublicMunicipalSelect";
import PublicBarangaySelect from "@/layout/PublicBarangaySelect";
//icons
import {
  User,
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  HeartPulse,
  Loader2,
  ClipboardList,
  Pencil,
  Trash2,
} from "lucide-react";
//
import { UpdatePatientSchema } from "@/interface/zod";
import type { Patient } from "@/interface/data";
import {
  patientData,
  updatePatient,
  deletePatient,
} from "@/db/statements/patient";

type UpdatePatientFormProps = zod.infer<typeof UpdatePatientSchema>;

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

const PatientDetail = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { patientId, lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery<Patient>({
    queryKey: ["patient-detail", patientId],
    queryFn: () => patientData(auth.token as string, patientId as string),
    enabled: !!patientId && !!auth.token,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const form = useForm<UpdatePatientFormProps>({
    resolver: zodResolver(UpdatePatientSchema),
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
    watch,
  } = form;

  const regionId = watch("region");
  const provinceId = watch("province");
  const municipalId = watch("municipal");

  // --- Update ---
  const onUpdate = async (formData: UpdatePatientFormProps) => {
    try {
      const updated = await updatePatient(auth.token as string, {
        id: patientId as string,
        firstname: formData.firstname,
        lastname: formData.lastname,
        middlename: formData.middlename,
        birthday: formData.birthday,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        illi: formData.illi,
        regionId: formData.region || undefined,
        provinceId: formData.province || undefined,
        municipalId: formData.municipal || undefined,
        barangayId: formData.barangay || undefined,
      });
      queryClient.setQueryData<Patient>(["patient-detail", patientId], updated);
      queryClient.setQueriesData<InfiniteData<ListProps>>(
        { queryKey: ["patient-list", lineId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              list: page.list.map((p) => (p.id === patientId ? updated : p)),
            })),
          };
        },
      );
      toast.success("Patient record updated.");
      setOnOpen(0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update patient.",
      );
    }
  };

  const openEdit = () => {
    if (!data) return;
    reset({
      firstname: data.firstname,
      lastname: data.lastname,
      middlename: data.middlename ?? "",
      birthday: data.birthday
        ? new Date(data.birthday).toISOString().split("T")[0]
        : "",
      email: data.email ?? "",
      phoneNumber: data.phoneNumber ?? "",
      illi: data.illi,
      region: data.regionId ?? "",
      province: data.provinceId ?? "",
      municipal: data.municipalId ?? "",
      barangay: data.barangayId ?? "",
    });
    setOnOpen(1);
  };

  // --- Delete ---
  const { mutateAsync: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: () => deletePatient(auth.token as string, patientId as string),
    onSuccess: () => {
      queryClient.setQueriesData<InfiniteData<ListProps>>(
        { queryKey: ["patient-list", lineId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              list: page.list.filter((p) => p.id !== patientId),
            })),
          };
        },
      );
      queryClient.removeQueries({ queryKey: ["patient-detail", patientId] });
      toast.success("Patient record deleted.");
      nav(`/${lineId}/patients-record`, { replace: true });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete patient.",
      );
    },
  });

  // --- Loading / not found ---
  if (isFetching) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <p className="text-xs text-gray-500">Loading patient record...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <div className="bg-gray-100 rounded-full p-3">
          <User className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 font-medium">Patient not found</p>
      </div>
    );
  }

  const age = data.birthday ? calculateAge(data.birthday) : null;
  const fullName = [data.firstname, data.middlename, data.lastname]
    .filter((s) => s && s !== "N/A")
    .join(" ");

  const address = [
    data.barangay?.name,
    data.municipal?.name,
    data.province?.name,
    data.region?.name,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="border rounded-lg bg-white">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
                  <HeartPulse className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900">{fullName}</h1>
                  <p className="text-[10px] text-gray-500">Patient Record</p>
                </div>
              </div>
              <Badge
                variant={data.illi ? "destructive" : "default"}
                className="text-[10px] px-2 py-0"
              >
                {data.illi ? "Ill" : "Active"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3 text-blue-500" />
              <h3 className="text-xs font-semibold text-gray-800">
                Personal Information
              </h3>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">Birthday</p>
                <p className="text-xs font-medium text-gray-800">
                  {data.birthday ? (
                    <>
                      {new Date(data.birthday).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      {age !== null && (
                        <span className="text-[10px] text-gray-400 ml-1">
                          ({age} yrs)
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">Not recorded</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Phone</p>
                <p className="text-xs font-medium text-gray-800">
                  {data.phoneNumber || (
                    <span className="text-gray-400">Not recorded</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Email</p>
                <p className="text-xs font-medium text-gray-800 truncate">
                  {data.email || (
                    <span className="text-gray-400">Not recorded</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Address</p>
                <p className="text-xs font-medium text-gray-800 truncate">
                  {address || (
                    <span className="text-gray-400">Not recorded</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Records */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ClipboardList className="h-3 w-3 text-blue-500" />
                <h3 className="text-xs font-semibold text-gray-800">
                  Medical Records
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {data._count?.record ?? 0}
              </Badge>
            </div>
          </div>
          <PatientRecords patientId={patientId as string} />
        </div>

        {/* Record Details & Actions */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <h3 className="text-xs font-semibold text-gray-800">
              Record Details
            </h3>
          </div>
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-500">Status</p>
                <Badge
                  variant={data.illi ? "destructive" : "default"}
                  className="text-[10px] px-2 py-0 mt-0.5"
                >
                  {data.illi ? "Ill" : "Active"}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Date Registered</p>
                <p className="text-xs text-gray-700 mt-0.5">
                  {new Date(data.timestamp).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Separator className="my-1" />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1 h-7"
                onClick={openEdit}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setOnOpen(2)}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Pencil className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold">Edit Patient Record</span>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[95vw] overflow-auto max-h-[90vh]"
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Save Changes"
        onFunction={handleSubmit(onUpdate)}
        loading={isSubmitting}
      >
        <div className="space-y-3 p-1">
          <Form {...form}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-8 text-xs"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="lastname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-8 text-xs"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="middlename"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700">
                      Middle Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-8 text-xs"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-1" />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={control}
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
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        Phone
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-8 text-xs"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        className="h-8 text-xs"
                        disabled={isSubmitting}
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
                    control={control}
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
                    control={control}
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
                    control={control}
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
                    control={control}
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

              <Separator className="my-1" />

              <FormField
                control={control}
                name="illi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700">
                      Status
                    </FormLabel>
                    <div className="flex gap-2">
                      {[
                        { label: "Active", value: false },
                        { label: "Ill", value: true },
                      ].map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                            field.value === opt.value
                              ? opt.value
                                ? "bg-red-50 border-red-300 text-red-700"
                                : "bg-blue-50 border-blue-300 text-blue-700"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-md">
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </div>
            <span className="text-sm font-semibold">Delete Patient</span>
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-sm w-[95vw]"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        yesTitle="Yes, Delete"
        onFunction={async () => {
          await handleDelete();
        }}
        loading={isDeleting}
      >
        <div className="p-1">
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-md">
            <Trash2 className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-900">
                Delete {fullName}?
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PatientDetail;
