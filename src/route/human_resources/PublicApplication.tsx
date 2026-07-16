import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router";
import { toast } from "sonner";

import { useTemAuth } from "@/provider/TempAuthProvider";
import {
  publicApplicationData,
  downloadPdsExcel,
  resolveAddressNames,
  withdrawApplication,
  reuploadApplicationFile,
  editApplicationContact,
} from "@/db/statement";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  formatPureDate,
  formatDate,
  calculateExperienceDuration,
} from "@/utils/date";
import { calculateAge, applicantionStatus } from "@/utils/helper";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PublicApplicationContact from "@/layout/PublicApplicationContact";

import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  GraduationCap,
  Briefcase,
  Award,
  Heart,
  Users,
  Home,
  Shield,
  Lightbulb,
  BookMarked,
  Trophy,
  Calendar,
  Loader2,
  Download,
  XCircle,
  AlertTriangle,
  Ban,
  Camera,
  Pencil,
} from "lucide-react";

import type { SubmittedApplicationProps } from "@/interface/data";

// ── Local building blocks ──────────────────────────────────────────────
const Section = ({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  children: React.ReactNode;
}) => (
  <div className="border rounded-lg bg-white overflow-hidden">
    <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
      {icon}
      <h3 className="text-xs font-semibold text-gray-800">{title}</h3>
      {typeof count === "number" && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">
          {count}
        </Badge>
      )}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
  <div>
    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-xs text-gray-800 mt-0.5 break-words">{value ?? "—"}</p>
  </div>
);

const TimelineItem = ({
  accent,
  title,
  trailing,
  children,
}: {
  accent: string;
  title: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <div className={`border-l-2 ${accent} pl-2.5 py-1`}>
    <div className="flex items-start justify-between gap-2 mb-0.5">
      <p className="text-[11px] font-semibold text-gray-900">{title}</p>
      {trailing}
    </div>
    <div className="space-y-0.5 text-[10px] text-gray-600">{children}</div>
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────
const PublicApplication = () => {
  const { applicationId } = useParams();
  const { token } = useTemAuth();

  const { data, isFetching } = useQuery<SubmittedApplicationProps>({
    queryKey: ["public-application-data", applicationId],
    queryFn: () =>
      publicApplicationData(token ?? "", applicationId as string),
    // The applicationId (a UUID, emailed only to the applicant) is the access
    // token now — no OTP gate. The endpoint is public and ignores the bearer.
    enabled: !!applicationId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  // Stored addresses hold PSGC codes, not names — resolve them for display.
  const { data: addr } = useQuery({
    queryKey: [
      "psgc-address-names",
      applicationId,
      data?.resProvince,
      data?.resCity,
      data?.resBarangay,
      data?.permaProvince,
      data?.permaCity,
      data?.permaBarangay,
    ],
    enabled: !!data,
    staleTime: Infinity,
    queryFn: async () => ({
      res: await resolveAddressNames({
        province: data?.resProvince,
        city: data?.resCity,
        barangay: data?.resBarangay,
      }),
      perma: await resolveAddressNames({
        province: data?.permaProvince,
        city: data?.permaCity,
        barangay: data?.permaBarangay,
      }),
    }),
  });

  const [downloading, setDownloading] = useState(false);
  const handleDownloadPds = async () => {
    if (!applicationId) return;
    setDownloading(true);
    try {
      await downloadPdsExcel({ applicationId });
    } catch {
      toast.error("Failed to download PDS. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Withdraw / cancel ───────────────────────────────────────────────────
  const queryClient = useQueryClient();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState("");
  const withdraw = useMutation({
    mutationFn: () => withdrawApplication(applicationId as string, withdrawReason),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["public-application-data", applicationId],
      });
      setWithdrawOpen(false);
      setWithdrawReason("");
      toast.success("Your application has been withdrawn.");
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.message ?? "Couldn't withdraw. Please try again.",
      ),
  });

  // status: 0 Pending · 1 For Interview · 2 Concluded · 3 Withdrawn
  const isWithdrawn = data?.status === 3;
  const isConcluded = data?.status === 2;
  const canWithdraw = !!data && !isWithdrawn && !isConcluded;
  // same rule: nothing is editable once concluded or withdrawn
  const canEdit = canWithdraw;

  // ── Replace profile photo ───────────────────────────────────────────────
  const changePhoto = useMutation({
    mutationFn: (file: File) =>
      reuploadApplicationFile({
        applicationId: applicationId as string,
        file,
        target: "profile",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["public-application-data", applicationId],
      });
      toast.success("Photo updated.");
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.message ?? "Couldn't update the photo. Try again.",
      ),
  });

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large (max 5 MB).");
      return;
    }
    changePhoto.mutate(file);
  };

  // ── Edit core details (name / email / phone) ────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstname: "",
    middleName: "",
    lastname: "",
    suffix: "",
    email: "",
    mobileNo: "",
    teleNo: "",
  });
  const openEdit = () => {
    if (!data) return;
    setEditForm({
      firstname: data.firstname ?? "",
      middleName: data.middleName === "N/A" ? "" : data.middleName ?? "",
      lastname: data.lastname ?? "",
      suffix: data.suffix === "N/A" ? "" : data.suffix ?? "",
      email: data.email ?? "",
      mobileNo: data.mobileNo ?? "",
      teleNo: data.teleNo ?? "",
    });
    setEditOpen(true);
  };
  const setField = (k: keyof typeof editForm, v: string) =>
    setEditForm((f) => ({ ...f, [k]: v }));
  const editMut = useMutation({
    mutationFn: () =>
      editApplicationContact({
        applicationId: applicationId as string,
        ...editForm,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["public-application-data", applicationId],
      });
      setEditOpen(false);
      toast.success("Your details were updated.");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Couldn't save. Try again."),
  });
  const editValid =
    editForm.firstname.trim() &&
    editForm.lastname.trim() &&
    editForm.email.trim() &&
    editForm.mobileNo.trim();

  if (isFetching && !data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-800">
            Application not found
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            The application data could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const fullName = [
    data.firstname,
    data.middleName,
    data.lastname,
    data.suffix,
  ]
    .filter(Boolean)
    .join(" ");

  const resAddress = [
    data.reshouseBlock,
    data.resStreet,
    data.resSub,
    addr?.res.barangay ?? data.resBarangay,
    addr?.res.city ?? data.resCity,
    addr?.res.province ?? data.resProvince,
    data.resZipCode,
  ]
    .filter(Boolean)
    .join(", ");

  const permaAddress = [
    data.permahouseBlock,
    data.permaStreet,
    data.permaSub,
    addr?.perma.barangay ?? data.permaBarangay,
    addr?.perma.city ?? data.permaCity,
    addr?.perma.province ?? data.permaProvince,
    data.permaZipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">

      {/* ── Withdraw confirmation ── */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b bg-red-50 flex items-start gap-2.5">
              <div className="p-1.5 bg-red-100 rounded-md flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Withdraw this application?
                </h3>
                <p className="text-[10px] text-red-700 mt-0.5">
                  The office will be notified that you cancelled. You can message
                  them afterward if you change your mind.
                </p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                Reason (optional)
              </p>
              <Textarea
                value={withdrawReason}
                onChange={(e) => setWithdrawReason(e.target.value)}
                placeholder="e.g. I accepted another position."
                className="text-xs min-h-[64px] resize-none"
                disabled={withdraw.isPending}
              />
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setWithdrawOpen(false)}
                disabled={withdraw.isPending}
              >
                Keep application
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => withdraw.mutate()}
                disabled={withdraw.isPending}
              >
                {withdraw.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    Withdraw
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit core details ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Edit your details
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Fix your name or how the office can reach you. The rest of your
                  PDS stays as submitted.
                </p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-2.5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-semibold text-gray-700">First name *</span>
                  <Input
                    value={editForm.firstname}
                    onChange={(e) => setField("firstname", e.target.value)}
                    className="h-8 text-xs mt-0.5"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-semibold text-gray-700">Last name *</span>
                  <Input
                    value={editForm.lastname}
                    onChange={(e) => setField("lastname", e.target.value)}
                    className="h-8 text-xs mt-0.5"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-semibold text-gray-700">Middle name</span>
                  <Input
                    value={editForm.middleName}
                    onChange={(e) => setField("middleName", e.target.value)}
                    className="h-8 text-xs mt-0.5"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-semibold text-gray-700">Suffix</span>
                  <Input
                    value={editForm.suffix}
                    onChange={(e) => setField("suffix", e.target.value)}
                    placeholder="Jr., III"
                    className="h-8 text-xs mt-0.5"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-semibold text-gray-700">Email *</span>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setField("email", e.target.value)}
                  className="h-8 text-xs mt-0.5"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="text-[10px] font-semibold text-gray-700">Mobile *</span>
                  <Input
                    value={editForm.mobileNo}
                    onChange={(e) => setField("mobileNo", e.target.value)}
                    placeholder="09XX XXX XXXX"
                    className="h-8 text-xs mt-0.5"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-semibold text-gray-700">Telephone</span>
                  <Input
                    value={editForm.teleNo}
                    onChange={(e) => setField("teleNo", e.target.value)}
                    className="h-8 text-xs mt-0.5"
                  />
                </label>
              </div>
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setEditOpen(false)}
                disabled={editMut.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => editMut.mutate()}
                disabled={editMut.isPending || !editValid}
              >
                {editMut.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-3 space-y-3">

        {/* Header card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="p-3 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={data.profilePic?.file_url}
                  alt={data.profilePic?.file_name}
                />
                <AvatarFallback className="text-xs">
                  {(data.firstname?.[0] ?? "") + (data.lastname?.[0] ?? "")}
                </AvatarFallback>
              </Avatar>
              {canEdit && (
                <>
                  <label
                    htmlFor="change-photo"
                    title="Change photo"
                    className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow"
                  >
                    {changePhoto.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </label>
                  <input
                    id="change-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onPickPhoto}
                    disabled={changePhoto.isPending}
                  />
                </>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                {fullName || "Unnamed applicant"}
              </h1>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                {data.forPosition && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {data.forPosition.name}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {applicantionStatus[data.status] ?? "—"}
                </Badge>
                <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" />
                  Applied {formatDate(data.timestamp)}
                </span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={handleDownloadPds}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download PDS (Excel)
              </Button>
              {canEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={openEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit details
                </Button>
              )}
              {canWithdraw && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setWithdrawOpen(true)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Withdraw
                </Button>
              )}
              {isWithdrawn && (
                <Badge
                  variant="outline"
                  className="h-8 px-2.5 gap-1.5 text-[11px] bg-red-50 text-red-700 border-red-200 flex items-center"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Withdrawn
                </Badge>
              )}
            </div>
          </div>
        </div>

        {isWithdrawn && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-3 flex items-start gap-2.5">
            <Ban className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-800">
                You withdrew this application
              </p>
              <p className="text-[11px] text-red-700 mt-0.5">
                The office has been notified. If this was a mistake, message them
                below and they can reopen it.
              </p>
            </div>
          </div>
        )}

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Left — primary info */}
          <div className="lg:col-span-2 space-y-3">

            <Section
              icon={<User className="h-3 w-3 text-blue-500" />}
              title="Personal Information"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label="Full Name" value={fullName} />
                <Field
                  label="Birth Date & Age"
                  value={
                    data.birthDate
                      ? `${formatPureDate(data.birthDate)} (${calculateAge(data.birthDate)} yrs)`
                      : "—"
                  }
                />
                <Field label="Gender" value={data.gender} />
                <Field label="Civil Status" value={data.civilStatus} />
                <Field
                  label="Citizenship"
                  value={
                    <>
                      {data.filipino ? "Filipino" : "Foreigner"}
                      {data.dualCitizen && `, Dual (${data.dualCitizenHalf ?? ""})`}
                    </>
                  }
                />
                <Field label="Blood Type" value={data.bloodType} />
              </div>
            </Section>

            {data.experience && data.experience.length > 0 && (
              <Section
                icon={<Briefcase className="h-3 w-3 text-blue-500" />}
                title="Work Experience"
                count={data.experience.length}
              >
                <div className="space-y-2">
                  {data.experience.map((exp, i) => (
                    <TimelineItem
                      key={i}
                      accent="border-blue-500"
                      title={exp.position || "Position"}
                      trailing={
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {calculateExperienceDuration(exp.from, exp.to)}
                        </Badge>
                      }
                    >
                      <p className="text-[11px] font-medium text-gray-800">
                        {exp.department || exp.employer}
                      </p>
                      <p>
                        {formatPureDate(exp.from)} —{" "}
                        {exp.to ? formatPureDate(exp.to) : "Present"}
                      </p>
                      {exp.statusOfAppointment && (
                        <p>Status: {exp.statusOfAppointment}</p>
                      )}
                      {!exp.govService && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 mt-1"
                        >
                          Government Service
                        </Badge>
                      )}
                    </TimelineItem>
                  ))}
                </div>
              </Section>
            )}

            {data.civilService && data.civilService.length > 0 && (
              <Section
                icon={<Award className="h-3 w-3 text-blue-500" />}
                title="Civil Service Eligibility"
                count={data.civilService.length}
              >
                <div className="space-y-2">
                  {data.civilService.map((e, i) => (
                    <TimelineItem
                      key={i}
                      accent="border-emerald-500"
                      title={e.title}
                      trailing={
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Rating: {e.rating}
                        </Badge>
                      }
                    >
                      <p>{e.type}</p>
                      <p>Date: {formatPureDate(e.date)}</p>
                      {e.placeOfExam && <p>Place: {e.placeOfExam}</p>}
                      {e.number && <p>License: {e.number}</p>}
                      {e.validity && <p>Validity: {e.validity}</p>}
                    </TimelineItem>
                  ))}
                </div>
              </Section>
            )}

            <Section
              icon={<GraduationCap className="h-3 w-3 text-blue-500" />}
              title="Educational Background"
            >
              <div className="space-y-2.5">
                {(
                  [
                    { level: "Elementary", entry: data.elementary, accent: "border-purple-500" },
                    { level: "Secondary", entry: data.secondary, accent: "border-blue-500" },
                    { level: "Vocational", entry: data.vocational, accent: "border-orange-500" },
                    { level: "College", entry: data.college, accent: "border-emerald-500" },
                    { level: "Graduate Studies", entry: data.graduateCollege, accent: "border-red-500" },
                  ] as const
                )
                  .filter((e) => e.entry)
                  .map(({ level, entry, accent }) => (
                    <TimelineItem
                      key={level}
                      accent={accent}
                      title={
                        <>
                          {level}
                          {entry!.name && (
                            <span className="text-[10px] font-normal text-gray-500 ml-1">
                              · {entry!.name}
                            </span>
                          )}
                        </>
                      }
                    >
                      <p>
                        {entry!.from} — {entry!.to || "Present"}
                      </p>
                      {(entry as any).degree && <p>Degree: {(entry as any).degree}</p>}
                      {entry!.highestLevel && (
                        <p>Highest Level: {entry!.highestLevel}</p>
                      )}
                      {entry!.yearGraduated && (
                        <p>Year Graduated: {entry!.yearGraduated}</p>
                      )}
                      {entry!.honors && <p>Honors: {entry!.honors}</p>}
                      {(entry as any).unitsEarned && (
                        <p>Units Earned: {(entry as any).unitsEarned}</p>
                      )}
                    </TimelineItem>
                  ))}
              </div>
            </Section>

            {data.voluntaryWork && data.voluntaryWork.length > 0 && (
              <Section
                icon={<Heart className="h-3 w-3 text-blue-500" />}
                title="Voluntary Work"
                count={data.voluntaryWork.length}
              >
                <div className="space-y-2">
                  {data.voluntaryWork.map((w, i) => (
                    <TimelineItem
                      key={i}
                      accent="border-pink-500"
                      title={w.organization}
                    >
                      <p className="text-[11px] font-medium text-gray-800">
                        {w.position}
                      </p>
                      <p>
                        {formatPureDate(w.from)} —{" "}
                        {w.to ? formatPureDate(w.to) : "Present"}
                      </p>
                      {w.hours && <p>{w.hours} hours</p>}
                    </TimelineItem>
                  ))}
                </div>
              </Section>
            )}

            {data.learningDev && data.learningDev.length > 0 && (
              <Section
                icon={<Lightbulb className="h-3 w-3 text-blue-500" />}
                title="Learning & Development"
                count={data.learningDev.length}
              >
                <div className="space-y-2">
                  {data.learningDev.map((t, i) => (
                    <TimelineItem
                      key={i}
                      accent="border-yellow-500"
                      title={t.title}
                      trailing={
                        t.type && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {t.type}
                          </Badge>
                        )
                      }
                    >
                      <p className="text-[11px] font-medium text-gray-800">
                        {t.conductedBy}
                      </p>
                      <p>
                        {formatPureDate(t.from)} —{" "}
                        {t.to ? formatPureDate(t.to) : "Present"}
                      </p>
                      {t.hours && <p>{t.hours} hours</p>}
                    </TimelineItem>
                  ))}
                </div>
              </Section>
            )}

            {data.otherInfo && data.otherInfo.length > 0 && (
              <Section
                icon={<BookMarked className="h-3 w-3 text-blue-500" />}
                title="Other Information"
                count={data.otherInfo.length}
              >
                <div className="space-y-2">
                  {data.otherInfo.map((info, i) => (
                    <TimelineItem
                      key={i}
                      accent="border-gray-400"
                      title={info.specialSkills}
                    >
                      {info.recognition && <p>{info.recognition}</p>}
                      {info.membership && <p>Membership: {info.membership}</p>}
                    </TimelineItem>
                  ))}
                </div>
              </Section>
            )}

            {data.references && data.references.length > 0 && (
              <Section
                icon={<Users className="h-3 w-3 text-blue-500" />}
                title="References"
                count={data.references.length}
              >
                <div className="space-y-2">
                  {data.references.map((r, i) => (
                    <TimelineItem
                      key={i}
                      accent="border-indigo-500"
                      title={`${r.name}${r.position ? " — " + r.position : ""}`}
                    >
                      <p className="text-[11px] font-medium text-gray-800">
                        {r.company}
                      </p>
                      {r.address && <p>{r.address}</p>}
                      {r.telephone && <p>Tel: {r.telephone}</p>}
                    </TimelineItem>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right — sidebar */}
          <div className="space-y-3">

            <Section
              icon={<Phone className="h-3 w-3 text-blue-500" />}
              title="Contact Information"
            >
              <div className="space-y-2.5">
                <Field
                  label={
                    <>
                      <Mail className="h-2.5 w-2.5 inline mr-1" />
                      Email
                    </>
                  }
                  value={data.email}
                />
                <Field label="Mobile" value={data.mobileNo} />
                <Field label="Telephone" value={data.teleNo} />
              </div>
            </Section>

            <Section
              icon={<MapPin className="h-3 w-3 text-blue-500" />}
              title="Address"
            >
              <div className="space-y-2.5">
                <Field
                  label={
                    <>
                      <Home className="h-2.5 w-2.5 inline mr-1" />
                      Residential
                    </>
                  }
                  value={resAddress || "—"}
                />
                <Field label="Permanent" value={permaAddress || "—"} />
              </div>
            </Section>

            <Section
              icon={<User className="h-3 w-3 text-blue-500" />}
              title="Physical Attributes"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <Field
                  label="Height"
                  value={data.height ? `${data.height} cm` : "—"}
                />
                <Field
                  label="Weight"
                  value={data.weight ? `${data.weight} kg` : "—"}
                />
              </div>
            </Section>

            <Section
              icon={<Shield className="h-3 w-3 text-blue-500" />}
              title="Government IDs"
            >
              <div className="space-y-1.5">
                {[
                  { label: "TIN", value: data.tinNo },
                  { label: "Pag-IBIG", value: data.pagIbigNo },
                  { label: "PhilHealth", value: data.philHealthNo },
                  { label: "UMID", value: data.umidNo },
                  { label: "PhilSys", value: data.philSys },
                ]
                  .filter((r) => r.value)
                  .map((r) => (
                    <div
                      key={r.label}
                      className="flex justify-between items-center"
                    >
                      <span className="text-[10px] text-gray-500">
                        {r.label}
                      </span>
                      <span className="text-[11px] font-mono text-gray-800">
                        {r.value}
                      </span>
                    </div>
                  ))}
                {![
                  data.tinNo,
                  data.pagIbigNo,
                  data.philHealthNo,
                  data.umidNo,
                  data.philSys,
                ].some(Boolean) && (
                  <p className="text-[10px] text-gray-400 italic">
                    No IDs provided.
                  </p>
                )}
              </div>
            </Section>

            <Section
              icon={<Users className="h-3 w-3 text-blue-500" />}
              title="Family"
            >
              <div className="space-y-2.5">
                {data.spouseFirstname && (
                  <Field
                    label="Spouse"
                    value={[data.spouseFirstname, data.spouseMiddle, data.spouseSurname]
                      .filter(Boolean)
                      .join(" ")}
                  />
                )}
                <Field
                  label="Father"
                  value={[data.fatherFirstname, data.fatherMiddlename, data.fatherSurname]
                    .filter(Boolean)
                    .join(" ")}
                />
                <Field
                  label="Mother"
                  value={[data.motherFirstname, data.motherMiddlename, data.motherSurname]
                    .filter(Boolean)
                    .join(" ")}
                />
                {data.children && (
                  <Field
                    label="Children"
                    value={
                      <ChildrenList raw={data.children as unknown as string} />
                    }
                  />
                )}
              </div>
            </Section>

            {data.ApplicationSkillTags && data.ApplicationSkillTags.length > 0 && (
              <Section
                icon={<Trophy className="h-3 w-3 text-blue-500" />}
                title="Skills"
                count={data.ApplicationSkillTags.length}
              >
                <div className="flex flex-wrap gap-1.5">
                  {data.ApplicationSkillTags.map((s, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {s.tags}
                    </Badge>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      <PublicApplicationContact
        applicationId={applicationId as string}
        token={token as string}
      />
    </div>
  );
};

const ChildrenList = ({ raw }: { raw: string }) => {
  let arr: { fullname: string }[] = [];
  try {
    arr = JSON.parse(raw);
    if (!Array.isArray(arr)) arr = [];
  } catch {
    arr = [];
  }
  if (arr.length === 0) {
    return <span className="text-[10px] text-gray-500">No children listed</span>;
  }
  return (
    <span>
      {arr.map((c, i) => (
        <span key={i}>
          {c.fullname}
          {i < arr.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
};

export default PublicApplication;
