import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import zod from "zod";
import { toast } from "sonner";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import PatientItem from "@/layout/patients/PatientItem";
import PsgcRegion from "@/layout/PsgcRegion";
import PublicProvinceSelect from "@/layout/PublicProvinceSelect";
import PublicMunicipalSelect from "@/layout/PublicMunicipalSelect";
import PublicBarangaySelect from "@/layout/PublicBarangaySelect";
//icons
import {
  Plus,
  Search,
  Users,
  Loader2,
  UserRound,
  MapPin,
  ChevronRight,
  Phone,
  Mail,
  CalendarDays,
} from "lucide-react";
//
import { NewPatientSchema } from "@/interface/zod";
import type { Patient } from "@/interface/data";
import { patientList, addPatient } from "@/db/statements/patient";

type NewPatientFormProps = zod.infer<typeof NewPatientSchema>;

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

const PatientList = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [text, setText] = useState("");
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [debouncedText] = useDebounce(text, 500);

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["patient-list", lineId, debouncedText],
      queryFn: ({ pageParam }) =>
        patientList(
          auth.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
          debouncedText,
        ),
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      initialPageParam: null,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });

  const list = data ? data.pages.flatMap((item) => item.list) : [];
  const isEmpty = !isFetching && list.length === 0;

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const form = useForm<NewPatientFormProps>({
    resolver: zodResolver(NewPatientSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      middlename: "",
      birthday: "",
      email: "",
      phoneNumber: "",
      region: "",
      province: "",
      municipal: "",
      barangay: "",
    },
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

  const onSubmit = async (data: NewPatientFormProps) => {
    try {
      const newPatient = await addPatient(auth.token as string, {
        firstname: data.firstname,
        lastname: data.lastname,
        middlename: data.middlename,
        birthday: data.birthday,
        email: data.email,
        phoneNumber: data.phoneNumber,
        regionId: data.region || undefined,
        provinceId: data.province || undefined,
        municipalId: data.municipal || undefined,
        barangayId: data.barangay || undefined,
        lineId: lineId as string,
      });
      queryClient.setQueriesData<InfiniteData<ListProps>>(
        { queryKey: ["patient-list", lineId] },
        (old) => {
          if (!old) return old;
          const patient: Patient = { _count: { record: 0 }, ...newPatient };
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === 0 ? { ...page, list: [patient, ...page.list] } : page,
            ),
          };
        },
      );
      toast.success("Patient registered successfully.");
      reset();
      setOnOpen(0);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to register patient.",
      );
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-3 py-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 hidden sm:inline">
              {list.length} patient{list.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Search patients..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="pl-7 h-7 text-xs w-44 sm:w-56 border-gray-200"
              />
            </div>
            <Button
              size="sm"
              onClick={() => setOnOpen(1)}
              className="h-7 gap-1 px-2 text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">Add Patient</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Total Patients", value: list.length },
            { label: "Active", value: list.filter((p) => !p.illi).length },
            { label: "Ill", value: list.filter((p) => p.illi).length },
            {
              label: "With Records",
              value: list.filter((p) => (p._count?.record ?? 0) > 0).length,
            },
          ].map((stat, i) => (
            <div key={i} className="border rounded-lg bg-white p-3">
              <p className="text-[10px] text-gray-500">{stat.label}</p>
              <p className="text-lg font-semibold text-gray-900 mt-0.5">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {isFetching && list.length === 0 ? (
          <div className="border rounded-lg bg-white p-10 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <p className="text-xs text-gray-500">Loading patients...</p>
          </div>
        ) : isEmpty ? (
          /* Empty state */
          <div className="border rounded-lg bg-white p-10 flex flex-col items-center justify-center text-center gap-2">
            <div className="p-2.5 bg-gray-100 rounded-full">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                No patients found
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {debouncedText
                  ? "Try adjusting your search terms"
                  : "Register your first patient to get started"}
              </p>
            </div>
            {debouncedText ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setText("")}
                className="h-7 text-xs"
              >
                Clear search
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOnOpen(1)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Patient
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile / tablet — card grid */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2">
              {list.map((item) => (
                <PatientItem key={item.id} item={item} />
              ))}
            </div>

            {/* Desktop — table */}
            <div className="hidden lg:block border rounded-lg bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-[10px] font-semibold text-gray-600 py-2 w-[240px]">
                      Patient
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-gray-600 py-2 w-[80px]">
                      Status
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-gray-600 py-2 w-[80px]">
                      Age
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-gray-600 py-2">
                      Phone
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-gray-600 py-2">
                      Email
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-gray-600 py-2">
                      Address
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-gray-600 py-2 text-center w-[70px]">
                      Records
                    </TableHead>
                    <TableHead className="w-[30px] py-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((item) => {
                    const fullName = [
                      item.firstname,
                      item.middlename,
                      item.lastname,
                    ]
                      .filter((s) => s && s !== "N/A")
                      .join(" ");
                    const age = item.birthday
                      ? calculateAge(item.birthday)
                      : null;
                    const address = [
                      item.barangay?.name,
                      item.municipal?.name,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <TableRow
                        key={item.id}
                        className="cursor-pointer hover:bg-blue-50/50 group"
                        onClick={() =>
                          nav(`/${lineId}/patients-record/${item.id}`)
                        }
                      >
                        {/* Name */}
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                              <UserRound className="h-3 w-3 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-gray-900 truncate max-w-[180px]">
                              {fullName}
                            </span>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-2">
                          <Badge
                            variant={item.illi ? "destructive" : "default"}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {item.illi ? "Ill" : "Active"}
                          </Badge>
                        </TableCell>

                        {/* Age */}
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CalendarDays className="h-3 w-3 text-gray-300 flex-shrink-0" />
                            {age !== null ? (
                              `${age} yrs`
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Phone */}
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3 text-gray-300 flex-shrink-0" />
                            {item.phoneNumber || (
                              <span className="text-gray-300">—</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="h-3 w-3 text-gray-300 flex-shrink-0" />
                            <span className="truncate max-w-[140px] block">
                              {item.email || (
                                <span className="text-gray-300">—</span>
                              )}
                            </span>
                          </div>
                        </TableCell>

                        {/* Address */}
                        <TableCell className="py-2">
                          <span className="text-xs text-gray-500 truncate max-w-[140px] block">
                            {address || <span className="text-gray-300">—</span>}
                          </span>
                        </TableCell>

                        {/* Records */}
                        <TableCell className="py-2 text-center">
                          <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
                            {item._count?.record ?? 0}
                          </span>
                        </TableCell>

                        {/* Arrow */}
                        <TableCell className="py-2">
                          <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Infinite scroll sentinel */}
            {hasNextPage && (
              <div
                ref={ref}
                className="flex items-center justify-center py-4 gap-1.5"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Loading more...</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">Scroll for more</span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Patient Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
              <UserRound className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Register New Patient</span>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-lg w-[95vw] overflow-auto max-h-[90vh]"
        setOnOpen={() => {
          if (isSubmitting) return;
          reset();
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Register Patient"
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      >
        <div className="space-y-3 p-1">
          <Form {...form}>
            <div className="space-y-3">
              {/* Name */}
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={control}
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
                        Last Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="dela Cruz"
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
                        placeholder="Santos"
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
                          placeholder="09XX XXX XXXX"
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
                        placeholder="patient@email.com"
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
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default PatientList;
