import { memo, useState } from "react";
import { useNavigate } from "react-router";
//
import {
  Item,
  ItemHeader,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemFooter,
  ItemActions,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import DownloadableFileItem from "@/layout/item/DownloadableFileItem";
//
import { formatDate } from "@/utils/date";
//
import { searchedChar } from "@/utils/element";
//icons
import { MoveRight, Users, Calendar, FileText, Clock } from "lucide-react";

//interfaces/props/
import type { JobPostProps } from "@/interface/data";
interface Props {
  item: JobPostProps;
  query: string;
  onApply?: (item: JobPostProps) => void;
}

const JobPostItem = ({ item, query, onApply }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const nav = useNavigate();

  console.log({ item });

  const handleApply = () => {
    setIsModalOpen(false);
    nav(`form/${item.id}`);
    onApply?.(item);
  };

  return (
    <>
      <Item
        variant="outline"
        className="w-full bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 rounded-lg"
      >
        <ItemHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <ItemTitle className="text-xl font-bold text-gray-900 leading-tight">
              {searchedChar(query, item.position.name)}
            </ItemTitle>
            <div className="flex items-center gap-2">
              {item.hideSG && item.salaryGrade && (
                <Badge variant="secondary" className="text-xs font-medium">
                  Grade {item.salaryGrade.grade}
                </Badge>
              )}
            </div>
          </div>
        </ItemHeader>

        <ItemContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Posted: {formatDate(item.timestamp)}</span>
            </div>

            {/* {item.deadline && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Deadline: {formatDate(item.deadline)}</span>
              </div>
            )} */}

            {item.showApplicationCount && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  {item._count?.application || 0} application
                  {(item._count?.application || 0) !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {item.salaryGrade && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{item.salaryGrade.grade || "N/A"}</span>
              </div>
            )}

            {item.unitPos && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{item.unitPos.unit.name || "N/A"}</span>
              </div>
            )}
          </div>

          <ItemDescription className="text-gray-700 leading-relaxed line-clamp-3">
            {item.desc}
          </ItemDescription>

          {item.requirements && item.requirements.length > 0 && (
            <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
              <FileText className="w-4 h-4" />
              <span>{item.requirements.length} requirement file(s)</span>
            </div>
          )}
        </ItemContent>

        <ItemFooter className="pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            {/* <div className="text-sm text-gray-600">
              {item.department && (
                <span className="font-medium">{item.department.name}</span>
              )}
            </div> */}

            <ItemActions>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                className="min-w-[120px]"
              >
                View Details
              </Button>
            </ItemActions>
          </div>
        </ItemFooter>
      </Item>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded"></div>
            <span className="font-bold text-xl">Job Details</span>
          </div>
        }
        onOpen={isModalOpen}
        className="lg:min-w-[800px] max-h-[90vh] overflow-auto"
        footer={1}
        setOnOpen={() => setIsModalOpen(false)}
      >
        <div className="space-y-6">
          {/* Header Section */}
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {item.position.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Posted on {formatDate(item.timestamp)}</span>
              </div>

              {/* {item.deadline && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Application deadline: {formatDate(item.deadline)}</span>
                </div>
              )} */}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Application deadline: Nov. 30, 2025</span>
              </div>

              {item.showApplicationCount && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>
                    {item._count?.application || 0} application
                    {(item._count?.application || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* {item.department && (
              <p className="text-lg text-gray-700 font-medium">
                {item.department.name}
              </p>
            )} */}
          </div>

          {/* Job Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Job Description
            </h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {item.desc}
            </p>
          </div>

          {/* Requirements Section */}
          {item.requirements && item.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Requirements
              </h3>

              <div className="space-y-4">
                {item.requirements.map((requirement, index) => (
                  <div
                    key={requirement.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm rounded-full">
                        {index + 1}
                      </span>
                      {requirement.title}
                    </h4>

                    {requirement.asset && requirement.asset.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 font-medium mb-2">
                          Downloadable files:
                        </p>
                        <div className="grid gap-2">
                          {requirement.asset.map((file, fileIndex) => (
                            <DownloadableFileItem
                              key={file.id}
                              file={file}
                              no={fileIndex}
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

          {/* Apply Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={handleApply}
              className="min-w-[140px] gap-2"
              size="lg"
            >
              <MoveRight className="w-4 h-4" />
              Apply Now
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(JobPostItem);
