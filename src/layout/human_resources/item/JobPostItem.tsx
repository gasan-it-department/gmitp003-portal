import { memo, useState } from "react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import DownloadableFileItem from "@/layout/item/DownloadableFileItem";

import { formatDate } from "@/utils/date";
import { searchedChar } from "@/utils/element";

import {
  MoveRight,
  Users,
  Calendar,
  FileText,
  Clock,
  Building2,
  Briefcase,
  Banknote,
  Eye,
  AlertCircle,
} from "lucide-react";

import type { JobPostProps } from "@/interface/data";

interface Props {
  item: JobPostProps;
  query: string;
  onApply?: (item: JobPostProps) => void;
}

const daysUntil = (deadline?: string | Date | null) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const JobPostItem = ({ item, query, onApply }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const nav = useNavigate();

  const isExternal = item.applyMode === "EXTERNAL";
  // PESO / external posts have no internal Position — use free-text fields.
  const displayTitle =
    item.position?.name ?? item.jobTitle ?? item.employerName ?? "Untitled";

  const handleApply = () => {
    // External PESO posts send applicants to the employer, not the in-app form.
    if (isExternal) {
      if (item.applyUrl)
        window.open(item.applyUrl, "_blank", "noopener,noreferrer");
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    nav(`form/${item.id}`);
    onApply?.(item);
  };

  const days = daysUntil(item.deadline ?? null);
  // hideSG === true → hide the salary grade from public viewers.
  const showSG = !item.hideSG && item.salaryGrade;

  const deadlineBadge = (() => {
    if (!item.deadline) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 gap-0.5"
        >
          <Clock className="h-2.5 w-2.5" />
          Open
        </Badge>
      );
    }
    if (days === null) return null;
    if (days <= 0) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-red-50 text-red-700 border-red-200 gap-0.5"
        >
          <Clock className="h-2.5 w-2.5" />
          Closed
        </Badge>
      );
    }
    if (days <= 7) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200 gap-0.5"
        >
          <Clock className="h-2.5 w-2.5" />
          {days} day{days === 1 ? "" : "s"} left
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 gap-0.5"
      >
        <Clock className="h-2.5 w-2.5" />
        {days} days left
      </Badge>
    );
  })();

  return (
    <>
      <div
        className="group border rounded-lg bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-colors overflow-hidden cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <Briefcase className="h-3 w-3 text-blue-500 flex-shrink-0" />
            <h3 className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700">
              {searchedChar(query, displayTitle)}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {item.postType === "PESO" && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200"
              >
                PESO
              </Badge>
            )}
            {deadlineBadge}
            {showSG && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 gap-0.5"
              >
                <Banknote className="h-2.5 w-2.5" />
                SG {item.salaryGrade!.grade}
              </Badge>
            )}
          </div>
        </div>

        <div className="p-3 space-y-2">
          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              Posted {formatDate(item.timestamp)}
            </span>
            {item.deadline && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                Deadline {formatDate(String(item.deadline))}
              </span>
            )}
            {item.unitPos?.unit?.name && (
              <span className="flex items-center gap-0.5">
                <Building2 className="h-2.5 w-2.5" />
                {item.unitPos.unit.name}
              </span>
            )}
            {item.showApplicationCount && (
              <span className="flex items-center gap-0.5">
                <Users className="h-2.5 w-2.5" />
                {item._count?.application ?? 0} applicant
                {(item._count?.application ?? 0) === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {/* Description preview */}
          {item.desc && (
            <p className="text-[11px] text-gray-700 line-clamp-2 leading-relaxed">
              {item.desc}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            {item.requirements && item.requirements.length > 0 ? (
              <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                <FileText className="h-2.5 w-2.5" />
                {item.requirements.length} requirement
                {item.requirements.length === 1 ? "" : "s"}
              </span>
            ) : (
              <span />
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
            >
              <Eye className="h-3 w-3" />
              View Details
            </Button>
          </div>
        </div>
      </div>

      {/* Details modal */}
      <Modal
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <Briefcase className="h-3 w-3 text-blue-500" />
            Job Details
          </div>
        }
        onOpen={isOpen}
        className="max-w-2xl max-h-[90vh] overflow-auto"
        footer={1}
        setOnOpen={() => setIsOpen(false)}
      >
        <div className="space-y-3">

          {/* Title row */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="p-3 space-y-1.5">
              <h1 className="text-sm font-semibold text-gray-900">
                {displayTitle}
              </h1>
              <div className="flex items-center gap-1.5 flex-wrap">
                {deadlineBadge}
                {showSG && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 gap-0.5"
                  >
                    <Banknote className="h-2.5 w-2.5" />
                    Salary Grade {item.salaryGrade!.grade}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[10px] text-gray-500 pt-1">
                <span className="flex items-center gap-0.5">
                  <Calendar className="h-2.5 w-2.5" />
                  Posted {formatDate(item.timestamp)}
                </span>
                {item.deadline && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    Deadline {formatDate(String(item.deadline))}
                  </span>
                )}
                {item.unitPos?.unit?.name && (
                  <span className="flex items-center gap-0.5">
                    <Building2 className="h-2.5 w-2.5" />
                    {item.unitPos.unit.name}
                  </span>
                )}
                {item.showApplicationCount && (
                  <span className="flex items-center gap-0.5">
                    <Users className="h-2.5 w-2.5" />
                    {item._count?.application ?? 0} applicant
                    {(item._count?.application ?? 0) === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="px-3 py-2 border-b bg-gray-50">
              <h3 className="text-xs font-semibold text-gray-800">
                Job Description
              </h3>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">
                {item.desc || "No description provided."}
              </p>
            </div>
          </div>

          {/* Requirements */}
          {item.requirements && item.requirements.length > 0 && (
            <div className="border rounded-lg bg-white overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-blue-500" />
                  Requirements
                </h3>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {item.requirements.length}
                </Badge>
              </div>
              <div className="p-3 space-y-2">
                {item.requirements.map((requirement, i) => (
                  <div
                    key={requirement.id}
                    className="border rounded-md bg-gray-50 p-2"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="flex items-center justify-center w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        {i + 1}
                      </span>
                      <p className="text-[11px] font-semibold text-gray-900">
                        {requirement.title}
                      </p>
                    </div>
                    {requirement.asset && requirement.asset.length > 0 && (
                      <div className="space-y-1 mt-1.5">
                        <p className="text-[10px] text-gray-500 font-medium">
                          Downloadable files:
                        </p>
                        <div className="grid gap-1">
                          {requirement.asset.map((file, j) => (
                            <DownloadableFileItem
                              key={file.id}
                              file={file}
                              no={j}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply */}
          <div className="border rounded-lg bg-white overflow-hidden">
            <div className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-[10px] text-gray-600 flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>
                  Make sure your documents and personal information are ready
                  before clicking <strong>Apply Now</strong>.
                </span>
              </div>
              <Button
                onClick={handleApply}
                disabled={
                  (!isExternal && days !== null && days <= 0) ||
                  (isExternal && !item.applyUrl)
                }
                className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <MoveRight className="h-3 w-3" />
                {isExternal
                  ? "Apply on employer site"
                  : days !== null && days <= 0
                    ? "Closed"
                    : "Apply Now"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(JobPostItem);
