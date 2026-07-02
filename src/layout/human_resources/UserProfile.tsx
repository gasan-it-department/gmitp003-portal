import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/provider/ProtectedRoute";

import { getUserData } from "@/db/statements/user";
import { downloadPdsExcel, userRecord, getUserVerifyInfo } from "@/db/statement";
import { userActiveStatus } from "@/utils/helper";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Calendar,
  Mail,
  Building,
  User as UserIcon,
  Award,
  FileText,
  CreditCard,
  Fingerprint,
  Heart,
  Home,
  Smartphone,
  Loader2,
  UserX,
  LayoutGrid,
  Download,
  History,
  Briefcase,
  Activity,
  CalendarClock,
} from "lucide-react";

import type { User } from "@/interface/data";
import UserProfileAction from "./UserProfileAction";

// ─────────────────────────────────────────────────────────────────────────
const formatDate = (date?: Date | string | null) => {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Small "field" row used across cards
const Field = ({
  label,
  value,
  icon: Icon,
  fallback = "Not provided",
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ElementType;
  fallback?: string;
}) => (
  <div>
    <p className="text-[10px] text-gray-500">{label}</p>
    <div className="flex items-center gap-1 mt-0.5">
      {Icon && <Icon className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />}
      {value !== undefined && value !== null && value !== "" ? (
        <p className="text-xs font-medium text-gray-800 truncate">{value}</p>
      ) : (
        <p className="text-xs text-gray-400 italic">{fallback}</p>
      )}
    </div>
  </div>
);

const SectionCard = ({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`border rounded-lg bg-white overflow-hidden ${className}`}
  >
    <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
      {Icon && <Icon className="h-3 w-3 text-blue-500" />}
      <h4 className="text-xs font-semibold text-gray-800">{title}</h4>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
const UserProfile = () => {
  const { employeeId, lineId } = useParams();
  const auth = useAuth();

  const {
    data: user,
    isError,
    isFetching,
  } = useQuery<User>({
    queryKey: ["user-data", employeeId],
    queryFn: () =>
      getUserData(
        auth.token as string,
        employeeId as string,
        auth.userId as string,
      ),
    enabled: !!auth.token && !!employeeId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const [downloading, setDownloading] = useState(false);

  // Verification QR (used on the ID card; scans to the public verify page).
  const { data: verify } = useQuery<{
    code: string;
    verifyUrl: string;
    qr: string;
  }>({
    queryKey: ["user-verify", employeeId],
    queryFn: () => getUserVerifyInfo(auth.token as string, employeeId as string),
    enabled: !!auth.token && !!employeeId,
    refetchOnWindowFocus: false,
  });

  // Platform history/record (appointments, employment changes, leaves, activity)
  const { data: record, isFetching: recordLoading } = useQuery<{
    counts: {
      appointment: number;
      employment: number;
      leave: number;
      activity: number;
    };
    timeline: {
      id: string;
      type: "appointment" | "employment" | "leave" | "activity";
      title: string;
      detail: string;
      timestamp: string;
    }[];
  }>({
    queryKey: ["user-record", employeeId],
    queryFn: () =>
      userRecord(auth.token as string, employeeId as string, lineId),
    enabled: !!auth.token && !!employeeId,
    refetchOnWindowFocus: false,
  });
  const handleDownloadPds = async () => {
    if (!employeeId) return;
    setDownloading(true);
    try {
      await downloadPdsExcel({ userId: employeeId });
    } catch {
      toast.error("Failed to download PDS. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (isFetching && !user) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading employee...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <UserX className="h-6 w-6 text-gray-300" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Employee not found
          </h3>
          <p className="text-[10px] text-gray-500">
            We couldn't load this profile. It may have been removed or you
            don't have permission.
          </p>
        </div>
      </div>
    );
  }

  // ── Derive display values with proper fallbacks ─────────────────────
  const app = user.submittedApplications;
  const firstName = app?.firstname ?? user.firstName ?? "";
  const middleName = app?.middleName ?? user.middleName ?? "";
  const lastName = app?.lastname ?? user.lastName ?? "";
  const suffix = user.suffix ?? "";
  const fullName =
    [firstName, middleName && `${middleName[0]}.`, lastName, suffix]
      .filter(Boolean)
      .join(" ") || "Unnamed";

  const initials = (
    (firstName?.[0] ?? "") + (lastName?.[0] ?? "")
  ).toUpperCase() || "?";

  const accountStatusLabel =
    user.account?.status !== undefined
      ? userActiveStatus[user.account.status]
      : null;

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 max-w-6xl mx-auto space-y-3">

        {/* ── Header card ─────────────────────────────────────────── */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-14 w-14 ring-2 ring-blue-100 flex-shrink-0">
                {user.userProfilePictures ? (
                  <AvatarImage
                    src={user.userProfilePictures.file_url}
                    alt={fullName}
                  />
                ) : null}
                <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {fullName}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {accountStatusLabel && (
                    <Badge
                      variant={
                        user.account?.status === 1 ? "default" : "secondary"
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {accountStatusLabel}
                    </Badge>
                  )}
                  <span className="text-[10px] text-gray-500">
                    Level {user.level}
                  </span>
                  {user.createdAt && (
                    <>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-500">
                        Joined {formatDate(user.createdAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <UserProfileAction
              userId={auth.userId as string}
              accountId={user.accountId as string}
              lineId={lineId as string}
              token={auth.token as string}
              userName={user.username}
            />
          </div>
        </div>

        {/* ── Verification QR ─────────────────────────────────────── */}
        {verify?.qr && (
          <div className="border rounded-lg bg-white p-3 flex items-center gap-3">
            <img
              src={verify.qr}
              alt="ID verification QR"
              className="h-20 w-20 flex-none"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-semibold text-gray-800">
                ID Verification QR
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Put this on the ID card. Scanning it confirms the holder against
                the live record.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  onClick={() => window.open(verify.verifyUrl, "_blank")}
                >
                  Open verify page
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px]"
                  onClick={() => {
                    navigator.clipboard
                      ?.writeText(verify.verifyUrl)
                      .then(() => toast.success("Verify link copied"))
                      .catch(() => {});
                  }}
                >
                  Copy link
                </Button>
                <a
                  href={verify.qr}
                  download={`id-qr-${employeeId}.png`}
                  className="inline-flex items-center h-7 px-3 text-[10px] rounded-md border bg-white hover:bg-gray-50"
                >
                  Download QR
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <Tabs defaultValue="overview" className="space-y-3">
          <TabsList className="grid w-full grid-cols-6 h-8">
            <TabsTrigger value="overview" className="text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="employment" className="text-xs">
              Employment
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs">
              Social Welfare
            </TabsTrigger>
            <TabsTrigger value="pds" className="text-xs">
              PDS
            </TabsTrigger>
            <TabsTrigger value="record" className="text-xs gap-1">
              <History className="h-3 w-3" />
              Record
            </TabsTrigger>
            <TabsTrigger value="modules" className="text-xs">
              Modules
            </TabsTrigger>
          </TabsList>

          {/* ── Overview ───────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-3 mt-0">
            <SectionCard title="Personal Information" icon={UserIcon}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                {/* Contact */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                    Contact
                  </p>
                  <Field label="Email" value={app?.email} icon={Mail} />
                  <Field label="Phone" value={app?.mobileNo} icon={Smartphone} />
                  <Field label="Username" value={user.username && `@${user.username}`} />
                  {user.birthDate && (
                    <Field
                      label="Date of Birth"
                      value={formatDate(user.birthDate)}
                      icon={Calendar}
                    />
                  )}
                </div>

                {/* Residential */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                    Residential Address
                  </p>
                  <Field label="Province" value={app?.resProvince} fallback="Not specified" />
                  <Field label="Municipality" value={app?.resCity} fallback="Not specified" />
                  <Field label="Barangay" value={app?.resBarangay} fallback="Not specified" />
                </div>

                {/* Permanent */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                    Permanent Address
                  </p>
                  <Field label="Province" value={app?.permaProvince} fallback="Not specified" />
                  <Field label="Municipality" value={app?.permaCity} fallback="Not specified" />
                  <Field label="Barangay" value={app?.permaBarangay} fallback="Not specified" />
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Employment ────────────────────────────────────── */}
          <TabsContent value="employment" className="space-y-3 mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <SectionCard title="Department & Position" icon={Building}>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Department</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.department?.name || (
                          <span className="text-gray-400 italic font-normal">
                            Not assigned
                          </span>
                        )}
                      </p>
                      {user.headedDepartment && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Head
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Position</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.Position?.name ||
                        user.PositionSlot?.pos?.name || (
                          <span className="text-gray-400 italic font-normal">
                            Not assigned
                          </span>
                        )}
                    </p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Compensation" icon={Award}>
                <div>
                  <p className="text-[10px] text-gray-500">Salary Grade</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user.SalaryGrade?.grade || (
                      <span className="text-gray-400 italic font-normal">
                        Not specified
                      </span>
                    )}
                  </p>
                  {user.SalaryGrade?.amount && (
                    <p className="text-xs text-gray-600 mt-1">
                      ₱
                      {user.SalaryGrade.amount.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  )}
                </div>
              </SectionCard>
            </div>
          </TabsContent>

          {/* ── Social Welfare ────────────────────────────────── */}
          <TabsContent value="social" className="space-y-3 mt-0">
            <SectionCard title="Government IDs & Social Welfare" icon={FileText}>
              <p className="text-[10px] text-gray-500 mb-3">
                Official identification numbers and social welfare memberships.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div className="space-y-2.5">
                  <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                    Government Identification
                  </p>
                  <Field
                    label="TIN (Tax Identification Number)"
                    value={app?.tinNo}
                    icon={FileText}
                  />
                  <Field
                    label="UMID (Unified Multi-Purpose ID)"
                    value={app?.umidNo}
                    icon={CreditCard}
                  />
                  <Field
                    label="PhilSys (Philippine Identification System)"
                    value={app?.philSys}
                    icon={Fingerprint}
                    fallback="Not registered"
                  />
                </div>

                <div className="space-y-2.5">
                  <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                    Social Welfare Memberships
                  </p>
                  <Field
                    label="Pag-IBIG Fund"
                    value={app?.pagIbigNo}
                    icon={Home}
                    fallback="Not a member"
                  />
                  <Field
                    label="PhilHealth"
                    value={app?.philHealthNo}
                    icon={Heart}
                    fallback="Not a member"
                  />
                  <Field
                    label="Agency Number"
                    value={app?.agencyNo}
                    icon={Building}
                    fallback="Not assigned"
                  />
                </div>
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── PDS (CS Form 212 — from the registration application) ── */}
          <TabsContent value="pds" className="space-y-3 mt-0">
            <div className="flex justify-end">
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
            </div>
            {!app ? (
              <SectionCard title="Personal Data Sheet" icon={FileText}>
                <p className="text-xs text-gray-400 italic text-center py-6">
                  No PDS / application record is linked to this employee.
                </p>
              </SectionCard>
            ) : (
              <>
                {app.voluntaryWork && app.voluntaryWork.length > 0 && (
                  <SectionCard title="Voluntary Work" icon={Heart}>
                    <div className="space-y-2">
                      {app.voluntaryWork.map((w: any, i: number) => (
                        <div key={i} className="border rounded-md bg-gray-50 p-2">
                          <p className="text-xs font-medium text-gray-800">
                            {w.organization || "—"}
                          </p>
                          {w.position && (
                            <p className="text-[11px] text-gray-600">
                              {w.position}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-500">
                            {w.from} — {w.to || "Present"}
                            {w.hours ? ` · ${w.hours} hrs` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {app.learningDev && app.learningDev.length > 0 && (
                  <SectionCard title="Learning & Development" icon={Award}>
                    <div className="space-y-2">
                      {app.learningDev.map((t: any, i: number) => (
                        <div key={i} className="border rounded-md bg-gray-50 p-2">
                          <p className="text-xs font-medium text-gray-800">
                            {t.title || "—"}
                          </p>
                          {t.conductedBy && (
                            <p className="text-[11px] text-gray-600">
                              {t.conductedBy}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-500">
                            {t.from} — {t.to || "Present"}
                            {t.hours ? ` · ${t.hours} hrs` : ""}
                            {t.type ? ` · ${t.type}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {app.otherInfo && app.otherInfo.length > 0 && (
                  <SectionCard title="Other Information" icon={FileText}>
                    <div className="space-y-2.5">
                      <Field
                        label="Special Skills & Hobbies"
                        value={app.otherInfo[0]?.specialSkills}
                      />
                      <Field
                        label="Non-Academic Distinctions"
                        value={
                          app.otherInfo[0]?.distinctions ??
                          app.otherInfo[0]?.recognition
                        }
                      />
                      <Field
                        label="Membership in Organizations"
                        value={
                          app.otherInfo[0]?.memberships ??
                          app.otherInfo[0]?.membership
                        }
                      />
                    </div>
                  </SectionCard>
                )}

                {app.references && app.references.length > 0 && (
                  <SectionCard title="References" icon={Building}>
                    <div className="space-y-2">
                      {app.references.map((r: any, i: number) => (
                        <div key={i} className="border rounded-md bg-gray-50 p-2">
                          <p className="text-xs font-medium text-gray-800">
                            {r.name || `Reference ${i + 1}`}
                          </p>
                          {(r.residentialAddress ?? r.address) && (
                            <p className="text-[11px] text-gray-600">
                              {r.residentialAddress ?? r.address}
                            </p>
                          )}
                          {(r.contact ?? r.telephone) && (
                            <p className="text-[10px] text-gray-500">
                              Contact: {r.contact ?? r.telephone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {app.govId && (app.govId.type || app.govId.number) && (
                  <SectionCard title="Government-Issued ID" icon={CreditCard}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                      <Field label="ID Type" value={app.govId.type} />
                      <Field label="ID No." value={app.govId.number} />
                      <Field
                        label="Date of Issuance"
                        value={app.govId.dateIssuance}
                      />
                      <Field
                        label="Place of Issuance"
                        value={app.govId.placeIssuance}
                      />
                    </div>
                  </SectionCard>
                )}

                {app.disclosures && (
                  <SectionCard title="Disclosure Questionnaire" icon={FileText}>
                    <div className="space-y-1.5">
                      {(
                        [
                          ["relatedThirdDegree", "Related (3rd degree) to appointing authority", "relatedDetails"],
                          ["relatedFourthDegree", "Related (4th degree) to appointing authority", "relatedDetails"],
                          ["guiltyAdmin", "Found guilty of an administrative offense", "guiltyAdminDetails"],
                          ["criminallyCharged", "Criminally charged before any court", "criminalDetails"],
                          ["convicted", "Convicted of any crime", "convictedDetails"],
                          ["separatedFromService", "Separated from the service", "separatedDetails"],
                          ["candidateLastYear", "Candidate in last year's election", "candidateDetails"],
                          ["resignedToCampaign", "Resigned to campaign before election", "resignedDetails"],
                          ["immigrant", "Immigrant / permanent resident abroad", "immigrantDetails"],
                          ["indigenousMember", "Member of an indigenous group", "indigenousDetails"],
                          ["pwd", "Person with disability", "pwdId"],
                          ["soloParent", "Solo parent", "soloParentId"],
                        ] as [string, string, string][]
                      ).map(([k, q, d]) => (
                        <div
                          key={k}
                          className="flex items-start justify-between gap-2 text-xs"
                        >
                          <span className="text-gray-700 flex-1 leading-snug">
                            {q}
                          </span>
                          <span className="flex flex-col items-end shrink-0">
                            <span
                              className={`text-[10px] px-1.5 py-0 rounded border ${
                                app.disclosures[k]
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-gray-50 text-gray-500 border-gray-200"
                              }`}
                            >
                              {app.disclosures[k] ? "Yes" : "No"}
                            </span>
                            {app.disclosures[k] && app.disclosures[d] && (
                              <span className="text-[10px] text-gray-500 mt-0.5 text-right max-w-[160px] break-words">
                                {app.disclosures[d]}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {!app.voluntaryWork?.length &&
                  !app.learningDev?.length &&
                  !app.otherInfo?.length &&
                  !app.references?.length &&
                  !(app.govId?.type || app.govId?.number) &&
                  !app.disclosures && (
                    <SectionCard title="Personal Data Sheet" icon={FileText}>
                      <p className="text-xs text-gray-400 italic text-center py-6">
                        No additional PDS sections were provided on this
                        application.
                      </p>
                    </SectionCard>
                  )}
              </>
            )}
          </TabsContent>

          {/* ── Record / History ──────────────────────────────── */}
          <TabsContent value="record" className="space-y-3 mt-0">
            <SectionCard title="Platform Record" icon={History}>
              {recordLoading && !record ? (
                <div className="flex items-center justify-center py-8 text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : !record || record.timeline.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">
                  No history yet — appointments, employment changes, leaves and
                  activity will appear here.
                </p>
              ) : (
                <>
                  {/* Summary counts */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {(
                      [
                        ["appointment", "Appointments", Briefcase, "text-blue-600"],
                        ["employment", "Employment", History, "text-indigo-600"],
                        ["leave", "Leaves", CalendarClock, "text-amber-600"],
                        ["activity", "Activity", Activity, "text-emerald-600"],
                      ] as const
                    ).map(([key, label, Icon, toneCls]) => (
                      <div
                        key={key}
                        className="border rounded-lg p-2 flex items-center gap-2 bg-gray-50/60"
                      >
                        <Icon className={`h-3.5 w-3.5 ${toneCls}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-none">
                            {record.counts[key]}
                          </p>
                          <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                            {label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Timeline */}
                  <ol className="relative border-l border-gray-200 ml-2 space-y-3">
                    {record.timeline.map((ev) => {
                      const tone =
                        ev.type === "appointment"
                          ? { dot: "bg-blue-500", Icon: Briefcase }
                          : ev.type === "employment"
                            ? { dot: "bg-indigo-500", Icon: History }
                            : ev.type === "leave"
                              ? { dot: "bg-amber-500", Icon: CalendarClock }
                              : { dot: "bg-emerald-500", Icon: Activity };
                      return (
                        <li key={ev.id} className="ml-4">
                          <span
                            className={`absolute -left-[7px] flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2 ring-white ${tone.dot}`}
                          />
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                                <tone.Icon className="h-3 w-3 text-gray-400 flex-none" />
                                <span className="truncate">{ev.title}</span>
                              </p>
                              {ev.detail && (
                                <p className="text-[10px] text-gray-500 mt-0.5">
                                  {ev.detail}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-none">
                              {formatDate(ev.timestamp)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </SectionCard>
          </TabsContent>

          {/* ── Modules ───────────────────────────────────────── */}
          <TabsContent value="modules" className="space-y-3 mt-0">
            <SectionCard title="Assigned Modules" icon={LayoutGrid}>
              <p className="text-[10px] text-gray-500 mb-3">
                {user.modules?.length || 0} module
                {user.modules?.length !== 1 ? "s" : ""} granted to this user.
              </p>
              {user.modules && user.modules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {user.modules.map((m, i) => (
                    <div
                      key={i}
                      className="border rounded-md bg-gray-50 px-2.5 py-1.5 flex items-center gap-1.5"
                    >
                      <LayoutGrid className="h-3 w-3 text-blue-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-800 truncate capitalize">
                        {m.moduleName}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic text-center py-6">
                  No modules assigned yet
                </p>
              )}
            </SectionCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
