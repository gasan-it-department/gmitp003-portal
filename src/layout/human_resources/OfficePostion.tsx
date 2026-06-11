import { useState } from "react";
import { useParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";

import { getAllPostions } from "@/db/statement";

import Modal from "@/components/custom/Modal";
import AddPosition from "./AddPosition";
import SelectUnitPosition from "./SelectUnitPosition";
import PositionItem from "./item/PositionItem";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableHeader,
} from "@/components/ui/table";

import {
  Plus,
  FolderPlus,
  Folder,
  Briefcase,
  Loader2,
  AlertCircle,
} from "lucide-react";

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
  const [onOpen, setOnOpen] = useState(0); // 0 closed · 1 new · 2 existing
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { lineId } = useParams();

  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useInfiniteQuery<LoadProps>({
    queryKey: ["postions", id],
    queryFn: ({ pageParam }) =>
      getAllPostions(id, token, pageParam as string | null, "20"),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!id && !!token,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const total = items.length;
  const openCount = items.filter((p) => (p._count?.slot || 0) > 0).length;

  const handleOpen = (which: number) => {
    setDropdownOpen(false);
    setTimeout(() => setOnOpen(which), 60);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Total: {total}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Open: {openCount}
          </Badge>
        </div>
        <div className="ml-auto">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-3 w-3" />
                Add Position
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleOpen(1)}
                className="text-[11px] gap-1.5"
              >
                <FolderPlus className="h-3 w-3" />
                Create New
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleOpen(2)}
                className="text-[11px] gap-1.5"
              >
                <Folder className="h-3 w-3" />
                Add Existing
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-10 text-[10px] font-semibold text-gray-700">
                  No
                </TableHead>
                <TableHead className="w-24 text-[10px] font-semibold text-gray-700">
                  Item No.
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  Title
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                  Designation
                </TableHead>
                <TableHead className="w-16 text-center text-[10px] font-semibold text-gray-700">
                  Slots
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[120px]">
                  Salary Grade
                </TableHead>
                <TableHead className="w-24 text-center text-[10px] font-semibold text-gray-700">
                  Status
                </TableHead>
                <TableHead className="w-24 text-center text-[10px] font-semibold text-gray-700">
                  Apps
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">
                        Failed to load positions
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(error as any)?.message ?? "Try again later."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isFetching && total === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading positions...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : total === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        No positions yet
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[280px]">
                        Add positions to start managing roles in this unit.
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1.5"
                          onClick={() => handleOpen(1)}
                        >
                          <FolderPlus className="h-3 w-3" />
                          Create New
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[10px] gap-1.5"
                          onClick={() => handleOpen(2)}
                        >
                          <Folder className="h-3 w-3" />
                          Add Existing
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <PositionItem
                    key={item.id}
                    item={item}
                    no={i + 1}
                    token={token}
                    userId={userId}
                    lineId={lineId as string}
                  />
                ))
              )}

              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={8} className="text-center py-2">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading more...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
              {!hasNextPage && total > 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-2 border-t bg-gray-50"
                  >
                    <span className="text-[10px] text-gray-500">
                      Showing all {total} position
                      {total !== 1 ? "s" : ""} · {openCount} open slot
                      {openCount !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
        className="min-w-[90vw] md:min-w-[640px] max-h-[95vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
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
        className="min-w-[90vw] md:max-w-3xl max-h-[95vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
        footer={1}
      />
    </div>
  );
};

export default OfficePostion;
