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
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
//
import { getAllPostions } from "@/db/statement";

import { Plus, FolderPlus, Folder, Briefcase } from "lucide-react";

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
    return allPositions.filter((position) => (position._count?.slot || 0) > 0)
      .length;
  };

  const handleModalOpen = (value: number) => {
    setActiveDropdown(null);
    setTimeout(() => {
      setOnOpen(value);
    }, 50);
  };

  const handleModalClose = () => {
    setOnOpen(0);
    setActiveDropdown(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Mobile Responsive */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="px-3 sm:px-4 py-2 flex items-center justify-end">
          <DropdownMenu
            open={activeDropdown === "add"}
            onOpenChange={(open) => setActiveDropdown(open ? "add" : null)}
          >
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Add Position</span>
                <span className="xs:hidden">Add</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleModalOpen(1)}
                className="gap-2 text-sm"
              >
                <FolderPlus className="h-4 w-4" />
                Create New
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleModalOpen(2)}
                className="gap-2 text-sm"
              >
                <Folder className="h-4 w-4" />
                Add Existing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Bar - Mobile Responsive */}
      {!isLoading && totalPositions > 0 && (
        <div className="px-3 sm:px-4 py-2 bg-white border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                Total: {totalPositions}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Open: {getOpenPositions()}
              </Badge>
            </div>
            <div className="text-xs text-gray-400">
              {totalPositions} position{totalPositions !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          {isLoading ? (
            // Mobile Loading Skeletons
            <div className="p-3 space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Card key={index} className="border shadow-sm">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                      <div className="flex items-center gap-2 pt-2">
                        <Skeleton className="h-6 w-16 rounded-md" />
                        <Skeleton className="h-6 w-16 rounded-md" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : allPositions.length > 0 ? (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50 z-10">
                    <TableRow>
                      <TableHead className="w-[50px] text-xs">No.</TableHead>
                      <TableHead className="w-[100px] text-xs">
                        Item No.
                      </TableHead>
                      <TableHead className="text-xs">Title</TableHead>
                      <TableHead className="text-xs">Designation</TableHead>
                      <TableHead className="w-[80px] text-center text-xs">
                        Slots
                      </TableHead>
                      <TableHead className="text-xs">Salary Grade</TableHead>
                      <TableHead className="w-[100px] text-center text-xs">
                        Status
                      </TableHead>
                      <TableHead className="w-[120px] text-center text-xs">
                        Apps
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
                    {isFetchingNextPage && (
                      <TableRow>
                        <TableCell colSpan={8} className="py-6">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                            <span className="text-xs text-gray-500">
                              Loading...
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View - Visible on mobile */}
              <div className="md:hidden p-3 space-y-3">
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

                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                    <span className="text-xs text-gray-500">
                      Loading more...
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Stats */}
              {!isFetchingNextPage && totalPositions > 0 && (
                <div className="px-3 sm:px-4 py-3 bg-gray-50 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Showing {totalPositions} position
                      {totalPositions !== 1 ? "s" : ""}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getOpenPositions()} open slots
                    </Badge>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Empty State - Mobile Responsive
            <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
              <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Briefcase className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                No Positions Found
              </h3>
              <p className="text-sm text-gray-500 mb-4 max-w-xs">
                This unit doesn't have any positions yet. Add positions to start
                managing roles.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button
                  onClick={() => handleModalOpen(1)}
                  size="sm"
                  className="gap-2 w-full sm:w-auto"
                >
                  <FolderPlus className="h-4 w-4" />
                  Create New
                </Button>
                <Button
                  onClick={() => handleModalOpen(2)}
                  variant="outline"
                  size="sm"
                  className="gap-2 w-full sm:w-auto"
                >
                  <Folder className="h-4 w-4" />
                  Add Existing
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
        className="min-w-[90vw] md:min-w-3xl max-h-[95vh] overflow-auto"
        setOnOpen={handleModalClose}
      />

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
        className="min-w-[90vw] md:max-w-4xl max-h-[95vh] overflow-auto"
        setOnOpen={handleModalClose}
        footer={1}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="border shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  Loading Positions
                </h3>
                <p className="text-xs text-gray-500">
                  Fetching unit positions...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OfficePostion;
