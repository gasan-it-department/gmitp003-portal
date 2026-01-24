//hooks and libs
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useState } from "react";
//
import Modal from "@/components/custom/Modal";
import AddPosition from "./AddPosition";
import PositionItem from "./item/PositionItem";
import SelectUnitPosition from "./SelectUnitPosition";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  // DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
//
import { getAllPostions } from "@/db/statement";

import {
  Plus,
  // Printer,
  FolderPlus,
  Folder,
  //Sheet,
  //ArrowUpDown,
  Briefcase,
  // Filter,
  // Download,
  Hash,
  Users,
  //Building2,
} from "lucide-react";

//props
import type { UnitPositionProps } from "@/interface/data";
interface Props {
  id: string;
  token: string;
  userId: string;
}

interface LoadProps {
  list: UnitPositionProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const OfficePostion = ({ id, token, userId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<
    "add" | "sort" | "export" | null
  >(null);
  const { lineId } = useParams();

  const { data, isFetching, isFetchingNextPage } = useInfiniteQuery<LoadProps>({
    queryKey: ["postions", id],
    queryFn: ({ pageParam }) =>
      getAllPostions(id, token, pageParam as string | null, "20"),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  const allPositions = data?.pages.flatMap((page) => page.list) || [];
  const totalPositions = allPositions.length;
  const isLoading =
    isFetching && !isFetchingNextPage && allPositions.length === 0;

  const getOpenPositions = () => {
    // Assuming open positions are those with slots > 0
    return allPositions.filter((position) => (position._count?.slot || 0) > 0)
      .length;
  };

  const handleModalOpen = (value: number) => {
    // Close the dropdown first
    setActiveDropdown(null);
    // Small delay to ensure dropdown closes completely
    setTimeout(() => {
      setOnOpen(value);
    }, 50);
  };

  const handleModalClose = () => {
    setOnOpen(0);
    // Reset dropdown state when modal closes
    setActiveDropdown(null);
  };

  return (
    <div className="w-full h-full flex flex-col ">
      {/* Header Section */}
      <div className="border-b">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center justify-end gap-2">
              <DropdownMenu
                open={activeDropdown === "add"}
                onOpenChange={(open) => setActiveDropdown(open ? "add" : null)}
              >
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Position
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => handleModalOpen(1)}
                    className="gap-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Create New Position
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleModalOpen(2)}
                    className="gap-2"
                  >
                    <Folder className="h-4 w-4" />
                    Add Existing Position
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* <DropdownMenu
                open={activeDropdown === "sort"}
                onOpenChange={(open) => setActiveDropdown(open ? "sort" : null)}
              >
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Salary Grade</DropdownMenuItem>
                  <DropdownMenuItem>Position Title</DropdownMenuItem>
                  <DropdownMenuItem>Item Number</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <Filter className="h-4 w-4" />
                    More Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}

              {/* <DropdownMenu
                open={activeDropdown === "export"}
                onOpenChange={(open) =>
                  setActiveDropdown(open ? "export" : null)
                }
              >
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem className="gap-2">
                    <Sheet className="h-4 w-4" />
                    Export to Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </div>
          </div>

          {!isLoading && totalPositions > 0 && (
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                <span>
                  Total Positions: <strong>{totalPositions}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>
                  Open Positions: <strong>{getOpenPositions()}</strong>
                </span>
              </div>
            </div>
          )}
        </div>
        <Separator />
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-hidden ">
        <div className="h-full overflow-auto">
          {isLoading ? (
            // Loading skeleton
            <div className="px-6 py-4 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : allPositions.length > 0 ? (
            <div className="min-w-full">
              {/* Table Header */}
              <div className="sticky top-0 z-10 bg-white border-b">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50">
                  <div className="col-span-1 font-semibold text-sm text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    No.
                  </div>
                  <div className="col-span-1 font-semibold text-sm text-gray-700 uppercase tracking-wider">
                    Item No.
                  </div>
                  <div className="col-span-2 font-semibold text-sm text-gray-700 uppercase tracking-wider">
                    Title
                  </div>
                  <div className="col-span-2 font-semibold text-sm text-gray-700 uppercase tracking-wider">
                    Designation
                  </div>
                  <div className="col-span-1 font-semibold text-sm text-gray-700 uppercase tracking-wider text-center">
                    Slots
                  </div>
                  <div className="col-span-1 font-semibold text-sm text-gray-700 uppercase tracking-wider text-center">
                    Open
                  </div>
                  <div className="col-span-2 font-semibold text-sm text-gray-700 uppercase tracking-wider">
                    Salary Grade
                  </div>
                  <div className="col-span-1 font-semibold text-sm text-gray-700 uppercase tracking-wider text-center">
                    Status
                  </div>
                  <div className="col-span-1 font-semibold text-sm text-gray-700 uppercase tracking-wider text-center">
                    Applications
                  </div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {allPositions.map((item, i) => (
                  <PositionItem key={item.id} item={item} no={i + 1} />
                ))}
              </div>

              {/* Loading more indicator */}
              {isFetchingNextPage && (
                <div className="px-6 py-6 bg-gray-50 border-t">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm text-gray-600">
                      Loading more positions...
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Empty state
            <div className="py-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Briefcase className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Positions Found
                </h3>
                <p className="text-gray-500 mb-6">
                  This unit doesn't have any positions yet. Add positions to
                  start managing roles and responsibilities.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => handleModalOpen(1)}
                    variant="default"
                    className="gap-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                    Create New Position
                  </Button>
                  <Button
                    onClick={() => handleModalOpen(2)}
                    variant="outline"
                    className="gap-2"
                  >
                    <Folder className="h-4 w-4" />
                    Add Existing Position
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* End of list summary */}
          {!isLoading && totalPositions > 0 && !isFetchingNextPage && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">{totalPositions}</span>{" "}
                  position{totalPositions !== 1 ? "s" : ""}
                </div>
                <Badge variant="outline" className="font-normal">
                  {totalPositions} total • {getOpenPositions()} open
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Position Modal */}
      <Modal
        title="Create New Position"
        children={
          <AddPosition
            existed={false}
            unitId={id}
            lineId={lineId as string}
            token={token}
            userId={userId}
          />
        }
        onOpen={onOpen === 1}
        footer={1}
        className="max-w-3xl max-h-[95vh] overflow-auto"
        setOnOpen={handleModalClose}
      />

      {/* Add Existing Position Modal */}
      <Modal
        title="Add Existing Position"
        children={
          <SelectUnitPosition
            setOnOpen={setOnOpen}
            token={token}
            lineId={lineId as string}
            officeId={id}
            userid={userId}
          />
        }
        cancelTitle="Close"
        onOpen={onOpen === 2}
        className="max-w-4xl max-h-[85vh]"
        setOnOpen={handleModalClose}
        footer={1}
      />

      {/* Initial loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-96 bg-white border rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Positions
              </h3>
              <p className="text-gray-500">Fetching unit positions...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficePostion;
