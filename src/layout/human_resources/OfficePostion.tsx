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
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableHeader,
} from "@/components/ui/table";
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
  // Hash,
  // Users,
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
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
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
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header Section */}
      <div className="border-b">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center justify-end gap-2 p-2">
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
          </div>
        </div>
        <Separator />
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {isLoading ? (
            // Loading skeleton using table structure
            <div className="px-6">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50">
                  <TableRow>
                    <TableHead className="w-[50px]">No.</TableHead>
                    <TableHead className="w-[100px]">Item No.</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead className="w-[80px] text-center">
                      Slots
                    </TableHead>
                    <TableHead className="w-[80px] text-center">Open</TableHead>
                    <TableHead>Salary Grade</TableHead>
                    <TableHead className="w-[100px] text-center">
                      Status
                    </TableHead>
                    <TableHead className="w-[120px] text-center">
                      Applications
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-8" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-12 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-12 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-16 mx-auto" />
                      </TableCell>
                      <TableCell className="text-center">
                        <Skeleton className="h-6 w-20 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : allPositions.length > 0 ? (
            <div className="h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                  <TableRow>
                    <TableHead className="w-[50px] font-semibold text-gray-700">
                      No.
                    </TableHead>
                    <TableHead className="w-[100px] font-semibold text-gray-700">
                      Item No.
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Title
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Designation
                    </TableHead>
                    <TableHead className="w-[80px] font-semibold text-gray-700 text-center">
                      Slots
                    </TableHead>

                    <TableHead className="font-semibold text-gray-700">
                      Salary Grade
                    </TableHead>
                    <TableHead className="w-[100px] font-semibold text-gray-700 text-center">
                      Status
                    </TableHead>
                    <TableHead className="w-[120px] font-semibold text-gray-700 text-center">
                      Applications
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPositions.map((item, i) => (
                    <PositionItem
                      key={item.id}
                      item={item}
                      no={i + 1}
                      token={token}
                      userId={userId}
                      lineId={lineId as string}
                    />
                  ))}

                  {/* Loading more indicator */}
                  {isFetchingNextPage && (
                    <TableRow>
                      <TableCell colSpan={9} className="py-6">
                        <div className="flex items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                          <span className="text-sm text-gray-600">
                            Loading more positions...
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* End of list summary - outside the table */}
              {!isFetchingNextPage && totalPositions > 0 && (
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
        </div>
      </div>

      {/* Create Position Modal */}
      <Modal
        title={undefined}
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
        className="min-w-3xl max-h-[95vh] overflow-auto"
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
        className="max-w-4xl max-h-[95vh] overflow-auto"
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
