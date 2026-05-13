import { useNavigate, useParams } from "react-router";
//
import { Badge } from "@/components/ui/badge";
//icons
import {
  User,
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  ChevronRight,
} from "lucide-react";
//
import type { Patient } from "@/interface/data";

interface Props {
  item: Patient;
}

const calculateAge = (birthday: string): number => {
  const birth = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const PatientItem = ({ item }: Props) => {
  const nav = useNavigate();
  const { lineId } = useParams();

  const fullName = [item.firstname, item.middlename, item.lastname]
    .filter((s) => s && s !== "N/A")
    .join(" ");

  const age = item.birthday ? calculateAge(item.birthday) : null;

  return (
    <div
      className="group bg-white rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-sm hover:border-blue-200 overflow-hidden"
      onClick={() => nav(`/${lineId}/patients-record/${item.id}`)}
    >
      <div className="p-3">
        {/* Top row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
              <User className="h-3.5 w-3.5 text-gray-500 group-hover:text-blue-600 transition-colors" />
            </div>
            <Badge
              variant={item.illi ? "destructive" : "default"}
              className="text-[10px] px-1.5 py-0"
            >
              {item.illi ? "Ill" : "Active"}
            </Badge>
          </div>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
        </div>

        {/* Name */}
        <h3 className="text-xs font-semibold text-gray-900 mb-2 truncate">
          {fullName}
        </h3>

        {/* Details */}
        <div className="space-y-1">
          {item.birthday && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <CalendarDays className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
              <span>{age !== null ? `${age} yrs old` : "—"}</span>
            </div>
          )}
          {item.phoneNumber && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Phone className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{item.phoneNumber}</span>
            </div>
          )}
          {item.email && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <Mail className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{item.email}</span>
            </div>
          )}
          {(item.barangay || item.municipal) && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <MapPin className="h-2.5 w-2.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {[item.barangay?.name, item.municipal?.name]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
        <p className="text-[10px] text-gray-400">
          {item._count?.record ?? 0} record
          {(item._count?.record ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
};

export default PatientItem;
