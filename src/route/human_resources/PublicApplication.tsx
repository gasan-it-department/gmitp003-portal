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
  Trash2,
  Plus,
} from "lucide-react";

import type { SubmittedApplicationProps } from "@/interface/data";

// ── Local building blocks ──────────────────────────────────────────────
const Section = ({
  icon,
  title,
  count,
  onEdit,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  onEdit?: () => void;
  children: React.ReactNode;
}) => (
  <div className="border rounded-lg bg-white overflow-hidden">
    <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
      {icon}
      <h3 className="text-xs font-semibold text-gray-800">{title}</h3>
      {typeof count === "number" && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {count}
        </Badge>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Pencil className="h-2.5 w-2.5" />
          Edit
        </button>
      )}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

// Gov IDs come back as "N/A" when unset — show blank in the editor instead.
const idOrBlank = (v: unknown) => (v == null || v === "N/A" ? "" : String(v));

// Education/PDS fields default to the literal "N/A" when unset — treat that
// (and null) as blank for both display and editing.
const eduVal = (v: unknown) => (v == null || v === "N/A" ? "" : String(v));

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

  // ── Generic per-section edit (writes only that section's fields) ─────────
  // `key` is the STORED field name the update endpoint expects.
  type EditFieldDef = {
    key: string;
    label: string;
    type?: "text" | "number" | "select";
    options?: string[];
  };
  const [section, setSection] = useState<{
    title: string;
    fields: EditFieldDef[];
  } | null>(null);
  const [sectionVals, setSectionVals] = useState<Record<string, string>>({});
  const openSection = (
    title: string,
    fields: (EditFieldDef & { value: unknown })[],
  ) => {
    setSection({ title, fields: fields.map(({ value, ...f }) => f) });
    setSectionVals(
      Object.fromEntries(
        fields.map((f) => [f.key, f.value == null ? "" : String(f.value)]),
      ),
    );
  };
  const sectionMut = useMutation({
    mutationFn: () =>
      updatePublicApplication(applicationId as string, sectionVals),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["public-application-data", applicationId],
      });
      setSection(null);
      toast.success("Saved.");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Couldn't save. Try again."),
  });

  const editPersonal = () =>
    openSection("Personal information", [
      { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"], value: data?.gender },
      { key: "cvilStatus", label: "Civil status", type: "select", options: ["Single", "Married", "Widowed", "Separated", "Other"], value: data?.civilStatus },
      { key: "bloodType", label: "Blood type", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"], value: data?.bloodType },
    ]);
  const editPhysical = () =>
    openSection("Physical attributes", [
      { key: "height", label: "Height (cm)", type: "number", value: data?.height },
      { key: "weight", label: "Weight (kg)", type: "number", value: data?.weight },
    ]);
  const editGovIds = () =>
    openSection("Government IDs", [
      { key: "tinNo", label: "TIN", value: idOrBlank(data?.tinNo) },
      { key: "pagIbigNo", label: "Pag-IBIG", value: idOrBlank(data?.pagIbigNo) },
      { key: "philHealthNo", label: "PhilHealth", value: idOrBlank(data?.philHealthNo) },
      { key: "umidNo", label: "UMID", value: idOrBlank(data?.umidNo) },
      { key: "philSys", label: "PhilSys", value: idOrBlank(data?.philSys) },
    ]);
  const editFamily = () =>
    openSection("Family", [
      { key: "fatherFirstname", label: "Father — first name", value: data?.fatherFirstname },
      { key: "fatherSurname", label: "Father — surname", value: data?.fatherSurname },
      { key: "motherFirstname", label: "Mother — first name", value: data?.motherFirstname },
      { key: "motherSurname", label: "Mother — surname", value: data?.motherSurname },
      { key: "spouseFirstname", label: "Spouse — first name", value: data?.spouseFirstname },
      { key: "spouseSurname", label: "Spouse — surname", value: data?.spouseSurname },
    ]);

  // ── Generic list/array editor (JSON columns) ────────────────────────────
  // Rows are edited in place: each row keeps its ORIGINAL object (spread), so
  // any stored keys the UI doesn't expose are preserved on save. The whole
  // array is written back through updatePublicApplication.
  type ArrFieldDef = {
    key: string;
    label: string;
    type?: "text" | "number" | "bool";
    full?: boolean; // span both columns
  };
  const [arrEdit, setArrEdit] = useState<{
    title: string;
    fields: ArrFieldDef[];
    rows: Record<string, any>[];
    fixed?: boolean; // fixed set of rows (no add/remove)
    rowLabel?: (row: Record<string, any>, i: number) => string;
    newRow: () => Record<string, any>;
    buildPayload: (rows: Record<string, any>[]) => Record<string, unknown>;
  } | null>(null);
  const openArray = (
    storeKey: string,
    title: string,
    fields: ArrFieldDef[],
    rows: unknown,
  ) =>
    setArrEdit({
      title,
      fields,
      rows: Array.isArray(rows) ? rows.map((r) => ({ ...(r as object) })) : [],
      newRow: () =>
        Object.fromEntries(
          fields.map((f) => [f.key, f.type === "bool" ? false : ""]),
        ),
      buildPayload: (rows) => ({ [storeKey]: rows }),
    });
  const setArrRow = (i: number, key: string, val: any) =>
    setArrEdit((s) =>
      s
        ? { ...s, rows: s.rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)) }
        : s,
    );
  const addArrRow = () =>
    setArrEdit((s) => (s ? { ...s, rows: [...s.rows, s.newRow()] } : s));
  const removeArrRow = (i: number) =>
    setArrEdit((s) => (s ? { ...s, rows: s.rows.filter((_, idx) => idx !== i) } : s));
  const arrMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      updatePublicApplication(applicationId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["public-application-data", applicationId],
      });
      setArrEdit(null);
      toast.success("Saved.");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Couldn't save. Try again."),
  });

  const editExperience = () =>
    openArray("experience", "Work Experience", [
      { key: "position", label: "Position / Title", full: true },
      { key: "department", label: "Department / Agency", full: true },
      { key: "employer", label: "Employer / Company", full: true },
      { key: "from", label: "From (e.g. 2020-01-15)" },
      { key: "to", label: "To (blank = present)" },
      { key: "statusOfAppointment", label: "Status of appointment", full: true },
      { key: "govService", label: "This is government service", type: "bool", full: true },
    ], data?.experience);
  const editCivilService = () =>
    openArray("civilService", "Civil Service Eligibility", [
      { key: "title", label: "Eligibility / Exam", full: true },
      { key: "rating", label: "Rating" },
      { key: "type", label: "Type" },
      { key: "date", label: "Date (e.g. 2019-08-11)" },
      { key: "placeOfExam", label: "Place of exam", full: true },
      { key: "number", label: "License number" },
      { key: "validity", label: "Validity" },
    ], data?.civilService);
  const editVoluntary = () =>
    openArray("voluntaryWork", "Voluntary Work", [
      { key: "organization", label: "Organization", full: true },
      { key: "position", label: "Position / Nature of work", full: true },
      { key: "from", label: "From" },
      { key: "to", label: "To (blank = present)" },
      { key: "hours", label: "Number of hours", type: "number" },
    ], data?.voluntaryWork);
  const editLearning = () =>
    openArray("learningDev", "Learning & Development", [
      { key: "title", label: "Title of training", full: true },
      { key: "conductedBy", label: "Conducted / Sponsored by", full: true },
      { key: "type", label: "Type of L&D" },
      { key: "hours", label: "Number of hours", type: "number" },
      { key: "from", label: "From" },
      { key: "to", label: "To (blank = present)" },
    ], data?.learningDev);
  const editOtherInfo = () =>
    openArray("otherInfo", "Other Information", [
      { key: "specialSkills", label: "Special skill / Hobby", full: true },
      { key: "recognition", label: "Non-academic recognition", full: true },
      { key: "membership", label: "Membership in association", full: true },
    ], data?.otherInfo);
  const editReferences = () =>
    openArray("references", "References", [
      { key: "name", label: "Name", full: true },
      { key: "position", label: "Position", full: true },
      { key: "company", label: "Company / Address", full: true },
      { key: "address", label: "Address", full: true },
      { key: "telephone", label: "Telephone" },
    ], data?.references);
  const editChildren = () => {
    // `children` is stored as a JSON string of [{ fullname, dob? }]; the
    // endpoint re-stringifies an array for us.
    let rows: any[] = [];
    try {
      const raw = data?.children as unknown as string;
      if (raw) rows = JSON.parse(raw);
    } catch {
      rows = [];
    }
    setArrEdit({
      title: "Children",
      fields: [
        { key: "fullname", label: "Full name", full: true },
        { key: "dob", label: "Date of birth" },
      ],
      rows: Array.isArray(rows) ? rows.map((r) => ({ ...r })) : [],
      newRow: () => ({ fullname: "", dob: "" }),
      buildPayload: (rows) => ({ children: rows }),
    });
  };
  // Educational Background — 5 fixed slots, each an object stored on its own
  // column. Uses the CANONICAL keys that submitApplication writes and the PDS
  // Excel export reads ({ name, course, from, to, highestAttained,
  // yearGraduate, records }).
  const EDU_SLOTS = [
    { storeKey: "elementary", label: "Elementary" },
    { storeKey: "secondary", label: "Secondary" },
    { storeKey: "vocational", label: "Vocational" },
    { storeKey: "college", label: "College" },
    { storeKey: "graduateCollege", label: "Graduate Studies" },
  ] as const;
  const EDU_KEYS = [
    "name",
    "course",
    "from",
    "to",
    "highestAttained",
    "yearGraduate",
    "records",
  ] as const;
  const editEducation = () => {
    const fields: ArrFieldDef[] = [
      { key: "name", label: "School / University", full: true },
      { key: "course", label: "Basic education / Degree / Course", full: true },
      { key: "from", label: "Period from (year)" },
      { key: "to", label: "Period to (year)" },
      { key: "highestAttained", label: "Highest level / units earned", full: true },
      { key: "yearGraduate", label: "Year graduated" },
      { key: "records", label: "Scholarship / Academic honors", full: true },
    ];
    const rows = EDU_SLOTS.map((s) => {
      const slot = ((data as any)?.[s.storeKey] as Record<string, unknown>) ?? {};
      const row: Record<string, any> = { __level: s.label };
      EDU_KEYS.forEach((k) => (row[k] = eduVal(slot[k])));
      return row;
    });
    setArrEdit({
      title: "Educational Background",
      fields,
      rows,
      fixed: true,
      rowLabel: (r) => r.__level,
      newRow: () => ({}),
      buildPayload: (rows) => {
        const payload: Record<string, unknown> = {};
        rows.forEach((row, i) => {
          // Mirror the submission format exactly: every slot is an object and
          // blank fields are stored as "N/A" (same as submitApplication), so
          // the PDS export and every other reader behave identically.
          payload[EDU_SLOTS[i].storeKey] = Object.fromEntries(
            EDU_KEYS.map((k) => [k, (row[k] ?? "").toString().trim() || "N/A"]),
          );
        });
        return payload;
      },
    });
  };

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

      {/* ── Generic per-section editor ── */}
      {section && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Edit {section.title.toLowerCase()}
              </h3>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-2.5 max-h-[70vh] overflow-y-auto">
              {section.fields.map((f) => (
                <label key={f.key} className="block">
                  <span className="text-[10px] font-semibold text-gray-700">
                    {f.label}
                  </span>
                  {f.type === "select" ? (
                    <select
                      value={sectionVals[f.key] ?? ""}
                      onChange={(e) =>
                        setSectionVals((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                      className="mt-0.5 w-full h-8 text-xs border rounded-md px-2 bg-white"
                    >
                      <option value="">—</option>
                      {(f.options ?? []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={f.type === "number" ? "number" : "text"}
                      value={sectionVals[f.key] ?? ""}
                      onChange={(e) =>
                        setSectionVals((v) => ({ ...v, [f.key]: e.target.value }))
                      }
                      className="h-8 text-xs mt-0.5"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setSection(null)}
                disabled={sectionMut.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => sectionMut.mutate()}
                disabled={sectionMut.isPending}
              >
                {sectionMut.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generic list / array section editor ── */}
      {arrEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 flex flex-col max-h-[88vh]">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2 flex-shrink-0">
              <Pencil className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                Edit {arrEdit.title.toLowerCase()}
              </h3>
              {!arrEdit.fixed && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 ml-auto"
                >
                  {arrEdit.rows.length}
                </Badge>
              )}
            </div>
            <div className="px-4 py-3 space-y-2.5 overflow-y-auto">
              {arrEdit.rows.length === 0 && (
                <p className="text-[11px] text-gray-400 italic text-center py-6">
                  Nothing added yet. Use “Add entry” below.
                </p>
              )}
              {arrEdit.rows.map((row, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-2.5 bg-gray-50/60 relative"
                >
                  {arrEdit.rowLabel ? (
                    <p className="text-[11px] font-semibold text-gray-700 mb-1.5">
                      {arrEdit.rowLabel(row, i)}
                    </p>
                  ) : (
                    !arrEdit.fixed && (
                      <button
                        type="button"
                        onClick={() => removeArrRow(i)}
                        className="absolute top-1.5 right-1.5 text-red-500 hover:text-red-600"
                        title="Remove this entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )
                  )}
                  <div className="grid grid-cols-2 gap-2 pr-4">
                    {arrEdit.fields.map((f) =>
                      f.type === "bool" ? (
                        <label
                          key={f.key}
                          className="col-span-2 flex items-center gap-1.5 text-[11px] font-medium text-gray-700 mt-0.5"
                        >
                          <input
                            type="checkbox"
                            checked={!!row[f.key]}
                            onChange={(e) => setArrRow(i, f.key, e.target.checked)}
                            className="h-3.5 w-3.5 accent-blue-600"
                          />
                          {f.label}
                        </label>
                      ) : (
                        <label
                          key={f.key}
                          className={f.full ? "col-span-2 block" : "block"}
                        >
                          <span className="text-[10px] font-semibold text-gray-600">
                            {f.label}
                          </span>
                          <Input
                            type={f.type === "number" ? "number" : "text"}
                            value={row[f.key] ?? ""}
                            onChange={(e) =>
                              setArrRow(
                                i,
                                f.key,
                                f.type === "number"
                                  ? e.target.value === ""
                                    ? ""
                                    : Number(e.target.value)
                                  : e.target.value,
                              )
                            }
                            className="h-7 text-xs mt-0.5"
                          />
                        </label>
                      ),
                    )}
                  </div>
                </div>
              ))}
              {!arrEdit.fixed && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 border-dashed"
                  onClick={addArrRow}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add entry
                </Button>
              )}
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => setArrEdit(null)}
                disabled={arrMut.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => arrMut.mutate(arrEdit.buildPayload(arrEdit.rows))}
                disabled={arrMut.isPending}
              >
                {arrMut.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
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
              onEdit={canEdit ? editPersonal : undefined}
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

            {(canEdit || (data.experience && data.experience.length > 0)) && (
              <Section
                icon={<Briefcase className="h-3 w-3 text-blue-500" />}
                title="Work Experience"
                count={data.experience?.length}
                onEdit={canEdit ? editExperience : undefined}
              >
                <div className="space-y-2">
                  {(!data.experience || data.experience.length === 0) && (
                    <p className="text-[10px] text-gray-400 italic">
                      No work experience added yet.
                    </p>
                  )}
                  {data.experience?.map((exp, i) => (
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

            {(canEdit || (data.civilService && data.civilService.length > 0)) && (
              <Section
                icon={<Award className="h-3 w-3 text-blue-500" />}
                title="Civil Service Eligibility"
                count={data.civilService?.length}
                onEdit={canEdit ? editCivilService : undefined}
              >
                <div className="space-y-2">
                  {(!data.civilService || data.civilService.length === 0) && (
                    <p className="text-[10px] text-gray-400 italic">
                      No eligibility added yet.
                    </p>
                  )}
                  {data.civilService?.map((e, i) => (
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
              onEdit={canEdit ? editEducation : undefined}
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
                  .filter((e) => e.entry && eduVal((e.entry as any).name))
                  .map(({ level, entry, accent }) => {
                    const en = entry as Record<string, any>;
                    return (
                      <TimelineItem
                        key={level}
                        accent={accent}
                        title={
                          <>
                            {level}
                            {eduVal(en.name) && (
                              <span className="text-[10px] font-normal text-gray-500 ml-1">
                                · {eduVal(en.name)}
                              </span>
                            )}
                          </>
                        }
                      >
                        <p>
                          {eduVal(en.from) || "—"} — {eduVal(en.to) || "Present"}
                        </p>
                        {eduVal(en.course) && (
                          <p>Course / Degree: {eduVal(en.course)}</p>
                        )}
                        {eduVal(en.highestAttained) && (
                          <p>Highest Level / Units: {eduVal(en.highestAttained)}</p>
                        )}
                        {eduVal(en.yearGraduate) && (
                          <p>Year Graduated: {eduVal(en.yearGraduate)}</p>
                        )}
                        {eduVal(en.records) && (
                          <p>Scholarship / Honors: {eduVal(en.records)}</p>
                        )}
                      </TimelineItem>
                    );
                  })}
              </div>
            </Section>

            {(canEdit || (data.voluntaryWork && data.voluntaryWork.length > 0)) && (
              <Section
                icon={<Heart className="h-3 w-3 text-blue-500" />}
                title="Voluntary Work"
                count={data.voluntaryWork?.length}
                onEdit={canEdit ? editVoluntary : undefined}
              >
                <div className="space-y-2">
                  {(!data.voluntaryWork || data.voluntaryWork.length === 0) && (
                    <p className="text-[10px] text-gray-400 italic">
                      No voluntary work added yet.
                    </p>
                  )}
                  {data.voluntaryWork?.map((w, i) => (
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

            {(canEdit || (data.learningDev && data.learningDev.length > 0)) && (
              <Section
                icon={<Lightbulb className="h-3 w-3 text-blue-500" />}
                title="Learning & Development"
                count={data.learningDev?.length}
                onEdit={canEdit ? editLearning : undefined}
              >
                <div className="space-y-2">
                  {(!data.learningDev || data.learningDev.length === 0) && (
                    <p className="text-[10px] text-gray-400 italic">
                      No trainings added yet.
                    </p>
                  )}
                  {data.learningDev?.map((t, i) => (
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

            {(canEdit || (data.otherInfo && data.otherInfo.length > 0)) && (
              <Section
                icon={<BookMarked className="h-3 w-3 text-blue-500" />}
                title="Other Information"
                count={data.otherInfo?.length}
                onEdit={canEdit ? editOtherInfo : undefined}
              >
                <div className="space-y-2">
                  {(!data.otherInfo || data.otherInfo.length === 0) && (
                    <p className="text-[10px] text-gray-400 italic">
                      No special skills, recognitions, or memberships added yet.
                    </p>
                  )}
                  {data.otherInfo?.map((info, i) => (
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

            {(canEdit || (data.references && data.references.length > 0)) && (
              <Section
                icon={<Users className="h-3 w-3 text-blue-500" />}
                title="References"
                count={data.references?.length}
                onEdit={canEdit ? editReferences : undefined}
              >
                <div className="space-y-2">
                  {(!data.references || data.references.length === 0) && (
                    <p className="text-[10px] text-gray-400 italic">
                      No references added yet.
                    </p>
                  )}
                  {data.references?.map((r, i) => (
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
              onEdit={canEdit ? editPhysical : undefined}
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
              onEdit={canEdit ? editGovIds : undefined}
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
              onEdit={canEdit ? editFamily : undefined}
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
                {(canEdit || data.children) && (
                  <Field
                    label={
                      <span className="flex items-center justify-between gap-2">
                        Children
                        {canEdit && (
                          <button
                            type="button"
                            onClick={editChildren}
                            className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 normal-case"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                            Edit
                          </button>
                        )}
                      </span>
                    }
                    value={
                      data.children ? (
                        <ChildrenList raw={data.children as unknown as string} />
                      ) : (
                        <span className="text-gray-400 italic">None added</span>
                      )
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
