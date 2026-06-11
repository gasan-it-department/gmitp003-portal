import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/provider/ProtectedRoute";
import { removeCookie } from "@/utils/cookies";
import { getUserData } from "@/db/statements/user";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import {
  LogOut,
  Loader2,
  Mail,
  AtSign,
  Calendar,
  Building2,
  MapPin,
  Network,
  ShieldCheck,
  Boxes,
  UserRound,
} from "lucide-react";

import type { User } from "@/interface/data";

const UserSideProfile = () => {
  const auth = useAuth();
  const nav = useNavigate();

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    removeCookie(`auth_token-${auth.userId}`);
    nav("/auth");
  };

  if (isFetching && !data) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-[10px]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex items-center justify-center px-3">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <UserRound className="h-5 w-5 text-gray-300" />
          <p className="text-[10px] font-medium text-gray-500">
            Profile unavailable
          </p>
        </div>
      </div>
    );
  }

  const user = data as User;
  const fullName = [
    user.firstName,
    user.middleName,
    user.lastName,
    user.suffix,
  ]
    .filter(Boolean)
    .join(" ");
  const profilePic = user.userProfilePictures?.file_url;
  const initials =
    `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();

  const isActive = (user.status as unknown as string) === "active";

  return (
    <div className="w-full h-full overflow-auto p-3 space-y-3">

      {/* Profile header */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-3 flex flex-col items-center gap-2 border-b bg-gray-50">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
              <AvatarImage
                src={profilePic}
                alt={fullName}
                className="object-cover"
              />
              <AvatarFallback className="text-xs font-semibold bg-blue-600 text-white">
                {initials || "U"}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                isActive ? "bg-emerald-500" : "bg-gray-400"
              }`}
              title={isActive ? "Active" : (user.status as unknown as string)}
            />
          </div>
          <div className="text-center min-w-0 w-full">
            <p className="text-xs font-semibold text-gray-900 truncate">
              {fullName}
            </p>
            <p className="text-[10px] text-gray-500 truncate flex items-center justify-center gap-1">
              <Mail className="h-2.5 w-2.5" />
              {user.email}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200"
            >
              Level {user.level ?? "—"}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {user.Position?.name || "No position"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Work details */}
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-blue-500" />
          <h3 className="text-xs font-semibold text-gray-800">
            Work Details
          </h3>
        </div>
        <div className="p-3 space-y-2.5">
          <Field
            icon={<Building2 className="h-2.5 w-2.5" />}
            label="Department"
            value={user.department?.name}
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
          <h3 className="text-xs font-semibold text-gray-800">Account</h3>
        </div>
        <div className="p-3 space-y-2.5">
          <Field
            icon={<AtSign className="h-2.5 w-2.5" />}
            label="Username"
            value={user.username}
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

      {/* Modules */}
      {user.modules && user.modules.length > 0 && (
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Boxes className="h-3 w-3 text-blue-500" />
              <h3 className="text-xs font-semibold text-gray-800">
                Module Access
              </h3>
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

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full h-8 text-[11px] gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
        onClick={handleLogout}
      >
        <LogOut className="h-3 w-3" />
        Logout
      </Button>
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

export default UserSideProfile;
