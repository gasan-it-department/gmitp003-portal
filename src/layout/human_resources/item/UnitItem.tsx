import { memo, useState } from "react";
import { useNavigate } from "react-router";
//
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu";
import ConfirmDelete from "@/layout/ConfirmDelete";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Modal from "@/components/custom/Modal";
//
import { Building2, Users, Calendar, Hash } from "lucide-react";

//Interface and Props
import type { Department } from "@/interface/data";

interface Props {
  item: Department;
  no: number;
}

const UnitItem = ({ item, no }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const nav = useNavigate();

  const handleNavigate = () => {
    nav(`${item.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getMemberCountColor = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-600 border-gray-200";
    if (count <= 5) return "bg-blue-50 text-blue-700 border-blue-200";
    if (count <= 10) return "bg-green-50 text-green-700 border-green-200";
    return "bg-purple-50 text-purple-700 border-purple-200";
  };

  return (
    <>
      <TooltipProvider>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-100"
              onClick={handleNavigate}
            >
              <div className="flex-1">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Serial Number */}
                  <div className="col-span-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      <span className="text-sm font-semibold text-gray-700">
                        {no}
                      </span>
                    </div>
                  </div>

                  {/* Unit Information */}
                  <div className="col-span-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 rounded-md bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Hash className="h-3 w-3" />
                            <span>{item.id.substring(0, 8)}...</span>
                          </div>
                          {item.createdAt && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(item.createdAt)}</span>
                            </div>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Count */}
                  <div className="col-span-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-blue/10">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div
                              className={`px-3 py-1.5 rounded-full border ${getMemberCountColor(0)}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold">
                                  {item._count.users || 0}
                                </span>
                                <span className="text-xs">members</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5">
                              Personnel count
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of personnel assigned to this unit</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Actions */}
                </div>
              </div>

              {/* Divider */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-100"></div>
            </div>
          </ContextMenuTrigger>

          <ContextMenuContent>
            <ContextMenuItem className="gap-2">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Unit
            </ContextMenuItem>
            <ContextMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={() => setOnOpen(0)}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete Unit
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </TooltipProvider>

      <Modal
        title={undefined}
        children={
          <ConfirmDelete
            confirmation={"confirm"}
            setOnOpen={setOnOpen}
            onFunction={function (): Promise<void> | void {
              throw new Error("Function not implemented.");
            }}
            isLoading={false}
          />
        }
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
      />
    </>
  );
};

export default memo(UnitItem);
