import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/provider/ProtectedRoute";
import { getApplicationData } from "@/db/statement";
import {
  formatPureDate,
  formatDate,
  calculateExperienceDuration,
} from "@/utils/date";
import { calculateAge, applicantionStatus } from "@/utils/helper";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Modal from "@/components/custom/Modal";
import ApplicationDataShow from "./ApplicationDataShow";
import ContactApplicant from "./ContactApplicant";

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
  BookMarked,
  Lightbulb,
  PhoneOutgoing,
  Loader2,
  Calendar,
} from "lucide-react";

import type { SubmittedApplicationProps } from "@/interface/data";

interface Props {
  applicationId?: string;
}

// ── Reusable building blocks (kept tiny + co-located so we don't bloat
// the file tree for one screen) ─────────────────────────────────────────
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

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
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

// ── Main component ─────────────────────────────────────────────────────
const ApplicationData = ({ applicationId }: Props) => {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [onOpen, setOnOpen] = useState(0);
  const auth = useAuth();

  const { data, isFetching } = useQuery<SubmittedApplicationProps>({
    queryKey: ["application", applicationId],
    queryFn: () =>
      getApplicationData(auth.token as string, applicationId as string),
    enabled: !!applicationId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-xs">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
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
    data.resBarangay,
    data.resCity,
    data.resProvince,
    data.resZipCode,
  ]
    .filter(Boolean)
    .join(", ");

  const permaAddress = [
    data.permahouseBlock,
    data.permaStreet,
    data.permaSub,
    data.permaBarangay,
    data.permaCity,
    data.permaProvince,
    data.permaZipCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-3 max-w-6xl mx-auto space-y-3">

        {/* Header card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ApplicationDataShow
                showData={
                  <div className="w-full flex justify-center">
                    <Avatar className="w-40 h-40">
                      <AvatarImage
                        src={data.profilePic?.file_url}
                        alt={data.profilePic?.file_name}
                      />
                      <AvatarFallback>
                        {fullName
                          .split(" ")
                          .map((s) => s[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                }
                isOpen={openModal === "profile"}
                setIsOpen={(open) => setOpenModal(open ? "profile" : null)}
                title="Applicant Photo"
              >
                <Avatar className="h-10 w-10 cursor-pointer">
                  <AvatarImage
                    src={data.profilePic?.file_url}
                    alt={data.profilePic?.file_name}
                  />
                  <AvatarFallback className="text-xs">
                    {fullName
                      .split(" ")
                      .map((s) => s[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </ApplicationDataShow>

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
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {applicantionStatus[data.status + 1] ?? "—"}
                  </Badge>
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                    <Calendar className="h-2.5 w-2.5" />
                    Applied {formatDate(data.timestamp)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setOnOpen(1)}
              className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              <PhoneOutgoing className="h-3 w-3" />
              Contact Applicant
            </Button>
          </div>
        </div>

        {/* Body grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* ── Left column (2/3) ─────────────────────────────────── */}
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
                      {data.dualCitizen &&
                        `, Dual (${data.dualCitizenHalf ?? ""})`}
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
                    { level: "Secondary",  entry: data.secondary,  accent: "border-blue-500" },
                    { level: "Vocational", entry: data.vocational, accent: "border-orange-500" },
                    { level: "College",    entry: data.college,    accent: "border-emerald-500" },
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

          {/* ── Right column (1/3) ────────────────────────────────── */}
          <div className="space-y-3">

            <Section
              icon={<Phone className="h-3 w-3 text-blue-500" />}
              title="Contact Information"
            >
              <div className="space-y-2.5">
                <Field
                  label="Email"
                  value={
                    <span className="flex items-center gap-1">
                      <Mail className="h-2.5 w-2.5 text-gray-400" />
                      {data.email}
                    </span>
                  }
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
                    </> as any
                  }
                  value={resAddress || "—"}
                />
                <Field
                  label="Permanent"
                  value={permaAddress || "—"}
                />
              </div>
            </Section>

            <Section
              icon={<User className="h-3 w-3 text-blue-500" />}
              title="Physical Attributes"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Height" value={data.height ? `${data.height} cm` : "—"} />
                <Field label="Weight" value={data.weight ? `${data.weight} kg` : "—"} />
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
                  .filter((row) => row.value)
                  .map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center"
                    >
                      <span className="text-[10px] text-gray-500">
                        {row.label}
                      </span>
                      <span className="text-[11px] font-mono text-gray-800">
                        {row.value}
                      </span>
                    </div>
                  ))}
                {![data.tinNo, data.pagIbigNo, data.philHealthNo, data.umidNo, data.philSys].some(
                  Boolean,
                ) && (
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
                    value={[
                      data.spouseFirstname,
                      data.spouseMiddle,
                      data.spouseSurname,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                )}
                <Field
                  label="Father"
                  value={[
                    data.fatherFirstname,
                    data.fatherMiddlename,
                    data.fatherSurname,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                <Field
                  label="Mother"
                  value={[
                    data.motherFirstname,
                    data.motherMiddlename,
                    data.motherSurname,
                  ]
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

            <Section
              icon={<FileText className="h-3 w-3 text-blue-500" />}
              title="Application Details"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Responses</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {data.ApplicationResponse?.length || 0}
                  </Badge>
                </div>

                <ApplicationDataShow
                  showData={
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-800">
                        Attached Files
                      </h3>
                      {data.fileAttached && data.fileAttached.length > 0 ? (
                        <div className="space-y-1.5">
                          {data.fileAttached.map((file, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2 border rounded"
                            >
                              <FileText className="h-3 w-3 text-gray-400" />
                              <span className="text-[11px] text-gray-800 truncate">
                                {file.file_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-500">
                          No files attached.
                        </p>
                      )}
                    </div>
                  }
                  isOpen={openModal === "files"}
                  setIsOpen={(open) => setOpenModal(open ? "files" : null)}
                  title="Attached Files"
                  className="max-w-lg"
                >
                  <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                    <span className="text-[10px] text-gray-500">
                      Attached Files
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {data.fileAttached?.length || 0}
                    </Badge>
                  </div>
                </ApplicationDataShow>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500">Conversations</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {data.ApplicationConversation?.length || 0}
                  </Badge>
                </div>

                <ApplicationDataShow
                  showData={
                    <div className="space-y-2">
                      {data.ApplicationSkillTags &&
                      data.ApplicationSkillTags.length > 0 ? (
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
                      ) : (
                        <p className="text-[10px] text-gray-500">
                          No skills listed.
                        </p>
                      )}
                    </div>
                  }
                  isOpen={openModal === "skills"}
                  setIsOpen={(open) => setOpenModal(open ? "skills" : null)}
                  title="Applicant Skills"
                  className="max-w-lg"
                >
                  <div className="flex justify-between items-center cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5">
                    <span className="text-[10px] text-gray-500">Skills</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {data.ApplicationSkillTags?.length || 0}
                    </Badge>
                  </div>
                </ApplicationDataShow>
              </div>
            </Section>
          </div>
        </div>
      </div>

      <Modal
        title="Contact Applicant"
        children={
          <ContactApplicant
            setOnOpen={setOnOpen}
            applicationId={data.id}
            token={auth.token as string}
            ids={[]}
            many={1}
          />
        }
        onOpen={onOpen === 1}
        className="max-w-2xl max-h-[90vh] overflow-auto"
        footer={1}
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

// Parse the JSON-string children blob safely.
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

export default ApplicationData;
