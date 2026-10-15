import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import { getUserData } from "@/db/statements/user";
import { downloadPdsExcel } from "@/db/statement";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  ArrowLeft,
  AtSign,
  Boxes,
  Building2,
  Calendar,
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  MapPin,
  Network,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import type { User } from "@/interface/data";

/**
 * A person's own profile, at full page weight.
 *
 * The side panel shows the same person in a strip a few centimetres wide,
 * which is right for glancing at and wrong for reading. This is the page
 * that strip links to: the same facts with room to breathe, plus the one
 * thing the panel cannot sensibly offer — the employee's own Personal Data
 * Sheet as the official CS Form 212.
 *
 * Open to every signed-in user with no module gate, like the Services
 * portal, because everybody has a profile whether or not they have been
 * enrolled in anything.
 */
const MyProfile = () => {
  const auth = useAuth();
  const { lineId } = useParams();
  const [downloading, setDownloading] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ["userProfile", auth.userId],
    queryFn: () =>
      getUserData(
        auth.token as string,
        auth.userId as string,
        auth.userId as string,
      ),
    enabled: !!auth.token && !!auth.userId,
    refetchOnWindowFocus: false,
  });

  const handleDownloadPds = async () => {
    if (!auth.userId || !auth.token) return;
    setDownloading(true);
    try {
      await downloadPdsExcel({
        userId: auth.userId,
        token: auth.token as string,
      });
    } catch {
      toast.error("Couldn't download your PDS. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-[11px]">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <UserRound className="h-6 w-6 text-gray-300" />
          <p className="text-xs font-medium text-gray-500">
            Profile unavailable
          </p>
          <Link
            to={`/${lineId}`}
            className="text-[11px] text-blue-600 hover:underline"
          >
            Back to the control panel
          </Link>
        </div>
      </div>
    );
  }

  const user = data as User;
  const fullName = [user.firstName, user.middleName, user.lastName, user.suffix]
    .filter(Boolean)
    .join(" ");
  const initials =
    `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();
  const isActive = (user.status as unknown as string) === "active";

  /*
    The PDS is generated from the application the employee registered
    with. Somebody onboarded through a quick invite has no such record, so
    there is genuinely nothing to generate — say so plainly rather than
    offer a button that can only fail.
  */
  const pds = user.submittedApplications;

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-blue-50/40 to-indigo-50/30">
      <div className="max-w-5xl mx-auto p-4 space-y-3">
        <Link
          to={`/${lineId}`}
          className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-1 w-fit"
        >
          <ArrowLeft className="h-3 w-3" /> Control panel
        </Link>

        {/* Identity */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4 border-b bg-gray-50">
            <div className="relative shrink-0 mx-auto sm:mx-0">
              <Avatar className="h-20 w-20 border-2 border-white shadow-sm">
                <AvatarImage
                  src={user.userProfilePictures?.file_url}
                  alt={fullName}
                  className="object-cover"
                />
                <AvatarFallback className="text-base font-semibold bg-blue-600 text-white">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                  isActive ? "bg-emerald-500" : "bg-gray-400"
                }`}
                title={isActive ? "Active" : (user.status as unknown as string)}
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {fullName}
              </h1>
              <p className="text-[11px] text-gray-500 truncate flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start mt-2">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
                >
                  Level {user.level ?? "—"}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {user.Position?.name || "No position"}
                </Badge>
                {user.department?.name && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {user.department.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Personal Data Sheet */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
            <FileSpreadsheet className="h-3 w-3 text-blue-500" />
            <h2 className="text-xs font-semibold text-gray-800">
              Personal Data Sheet
            </h2>
          </div>
          <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-gray-700">
                Your CS Form 212 (Revised 2026), filled in from your records.
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {pds
                  ? "Downloads as an Excel workbook you can print or attach."
                  : "You have no PDS on file — this account was created without an application form. Ask HR to register one if you need it."}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleDownloadPds}
              disabled={downloading || !pds}
              className="h-8 text-[11px] gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0"
            >
              {downloading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              {downloading ? "Preparing..." : "Download PDS"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Work */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
              <Building2 className="h-3 w-3 text-blue-500" />
              <h2 className="text-xs font-semibold text-gray-800">
                Work Details
              </h2>
            </div>
            <div className="p-3 space-y-2.5">
              <Field
                icon={<Building2 className="h-2.5 w-2.5" />}
                label="Department"
                value={user.department?.name}
              />
              <Field
                icon={<UserRound className="h-2.5 w-2.5" />}
                label="Position"
                value={user.Position?.name}
              />
              <Field
                icon={<MapPin className="h-2.5 w-2.5" />}
                label="Location"
                value={user.region?.name || user.province?.name}
              />
              {user.lineId && (
                <Field
                  icon={<Network className="h-2.5 w-2.5" />}
                  label="Line ID"
                  value={
                    <span className="font-mono text-[11px]">{user.lineId}</span>
                  }
                />
              )}
            </div>
          </div>

          {/* Account */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3 text-blue-500" />
              <h2 className="text-xs font-semibold text-gray-800">Account</h2>
            </div>
            <div className="p-3 space-y-2.5">
              <Field
                icon={<AtSign className="h-2.5 w-2.5" />}
                label="Username"
                value={user.username}
              />
              <Field
                icon={<Mail className="h-2.5 w-2.5" />}
                label="Email"
                value={user.email}
              />
              <Field
                icon={<Calendar className="h-2.5 w-2.5" />}
                label="Member Since"
                value={
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Module access */}
        {user.modules && user.modules.length > 0 && (
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Boxes className="h-3 w-3 text-blue-500" />
                <h2 className="text-xs font-semibold text-gray-800">
                  Module Access
                </h2>
              </div>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {user.modules.length}
              </Badge>
            </div>
            <div className="p-3 flex flex-wrap gap-1.5">
              {user.modules.map((m) => (
                <Badge
                  key={m.id}
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
                >
                  {m.moduleName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-2">
    <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase tracking-wide flex-shrink-0">
      {icon}
      {label}
    </div>
    <p className="text-[11px] text-gray-800 text-right break-words min-w-0">
      {value ?? "—"}
    </p>
  </div>
);

export default MyProfile;
