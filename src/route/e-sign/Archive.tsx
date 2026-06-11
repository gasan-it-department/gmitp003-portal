import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useDebounce } from "use-debounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRoom } from "@/provider/DocumentRoomProvider";

import { documents } from "@/db/statements/document";
import { archiveDocType } from "@/utils/helper";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Modal from "@/components/custom/Modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import SearchArchive from "@/layout/e-sign/SearchArchive";

import {
  CloudUpload,
  Search,
  Inbox,
  FileText,
  Loader2,
  ChevronRight,
  Archive as ArchiveIcon,
} from "lucide-react";

import type { ArchiveDocument } from "@/interface/data";

interface ListProps {
  list: ArchiveDocument[];
  hasMore: boolean;
  lastCursor: string | null;
}

const formatDate = (iso?: Date | string | null) => {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const Archive = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [text, setText] = useState("");
  const { lineId } = useParams();
  const auth = useAuth();
  const room = useRoom();
  const nav = useNavigate();

  const [query] = useDebounce(text, 500);

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["archived-documents", room.room?.id, query],
      queryFn: ({ pageParam }) =>
        documents(
          auth.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
          query,
        ),
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      initialPageParam: null,
      refetchOnWindowFocus: false,
    });

  const list = data?.pages.flatMap((p) => p.list) ?? [];
  const isLoading = isFetching && list.length === 0;
  const isEmpty = !isLoading && list.length === 0;

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      <div className="p-3 flex-1 flex flex-col min-h-0">

        {/* Header */}
        <div className="border rounded-lg bg-white overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ArchiveIcon className="h-3 w-3 text-blue-500" />
              <div>
                <h3 className="text-xs font-semibold text-gray-800">Archive</h3>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                  {list.length} document{list.length !== 1 ? "s" : ""} archived
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
              onClick={() => nav("new")}
            >
              <CloudUpload className="h-3 w-3" />
              New Document
            </Button>
          </div>

          {/* Search row */}
          <div className="px-3 py-2 border-b">
            <button
              type="button"
              onClick={() => setOnOpen(1)}
              className="w-full h-8 px-2.5 flex items-center gap-2 border rounded-md text-left hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
            >
              <Search className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 flex-1">
                Search by title, ID, or content...
              </span>
              <kbd className="hidden sm:inline-block text-[10px] px-1 py-0.5 border rounded text-gray-400 bg-gray-50">
                Advanced
              </kbd>
            </button>

            {/* Optional inline quick filter */}
            <div className="mt-2">
              <input
                type="text"
                placeholder="Quick filter by title..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-8 px-2.5 border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {query && (
                <p className="text-[10px] text-gray-500 mt-1">
                  Filtering by <span className="font-medium">"{query}"</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-white overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-gray-100 sticky top-0 z-10">
                <TableRow className="hover:bg-gray-100 border-b">
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-12">
                    #
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-28">
                    Doc ID
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 min-w-[220px]">
                    Title
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-24">
                    Type
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-28">
                    Archived
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-28">
                    Retention
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 w-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs">Loading documents...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isEmpty ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <Inbox className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-xs font-medium text-gray-500">
                          {query
                            ? "No documents match your filter"
                            : "No archived documents yet"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {query
                            ? "Try a different keyword"
                            : "Click 'New Document' to archive your first one"}
                        </p>
                        {query && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] mt-1"
                            onClick={() => setText("")}
                          >
                            Clear filter
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {list.map((item, i) => (
                      <TableRow
                        key={item.id}
                        onClick={() => nav(item.id)}
                        className="border-b hover:bg-gray-50 cursor-pointer group transition-colors"
                      >
                        <TableCell className="px-3 py-2 text-xs text-gray-500 font-medium">
                          {(i + 1).toString().padStart(2, "0")}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <code className="text-[10px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                            {item.id.slice(0, 8)}
                          </code>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-800 truncate">
                              {item.document?.title || "Untitled"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {archiveDocType[item.docType] ?? "Other"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-xs text-gray-600">
                          {formatDate(item.timestamp)}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          {item.retentionDate ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {formatDate(item.retentionDate)}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              Permanent
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right">
                          <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-blue-500 ml-auto transition-colors" />
                        </TableCell>
                      </TableRow>
                    ))}

                    {hasNextPage && (
                      <TableRow ref={ref}>
                        <TableCell colSpan={7} className="h-10 p-0" />
                      </TableRow>
                    )}

                    {isFetchingNextPage && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-gray-400">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-[10px]">Loading more...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {!hasNextPage && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-3 text-center border-t">
                          <p className="text-[10px] text-gray-400">
                            All {list.length} document{list.length !== 1 ? "s" : ""} loaded
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Advanced search modal */}
      <Modal
        title={undefined}
        children={
          <SearchArchive
            full={false}
            roomId={room.room?.id ?? ""}
            lineId={lineId ?? ""}
            token={auth.token as string}
          />
        }
        onOpen={onOpen === 1}
        className="min-w-2xl max-h-[90vh] overflow-auto"
        footer={1}
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default Archive;
