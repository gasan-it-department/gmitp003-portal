import { memo } from "react";
import { useNavigate } from "react-router";
//
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
//
import { formatDate } from "@/utils/date";
import { searchedChar } from "@/utils/element";
//
import {
  Building2,
  Calendar,
  Users,
  ExternalLink,
  Pencil,
  MapPin,
} from "lucide-react";
import type { JobPostProps } from "@/interface/data";

interface Props {
  item: JobPostProps;
  query: string;
}

const statusMeta = (status: number) => {
  switch (status) {
    case 1:
      return { label: "Published", className: "bg-green-100 text-green-700" };
    case 3:
      return { label: "Paused", className: "bg-amber-100 text-amber-700" };
    default:
      return { label: "Draft", className: "bg-gray-100 text-gray-600" };
  }
};

const PesoJobItem = ({ item, query }: Props) => {
  const nav = useNavigate();
  const status = statusMeta(item.status);
  const isExternal = item.applyMode === "EXTERNAL";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {searchedChar(query, item.jobTitle ?? "Untitled")}
            </h3>
            <Badge className={status.className}>{status.label}</Badge>
            <Badge variant="outline" className="gap-1">
              {isExternal ? (
                <>
                  <ExternalLink className="h-3 w-3" /> External apply
                </>
              ) : (
                <>
                  <Users className="h-3 w-3" /> In-app apply
                </>
              )}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
            {item.employerName && (
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {item.employerName}
              </span>
            )}
            {item.location && item.location !== "N/A" && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {item.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(item.timestamp)}
            </span>
            {!isExternal && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {item._count?.application ?? 0} application
                {(item._count?.application ?? 0) !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {item.employmentType && (
            <p className="mt-1 text-xs text-gray-500">{item.employmentType}</p>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="gap-1 shrink-0"
          onClick={() => nav(`post/${item.id}`)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Manage
        </Button>
      </div>
    </div>
  );
};

export default memo(PesoJobItem);
