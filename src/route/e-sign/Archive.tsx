import { useState } from "react";
import { useInView } from "react-intersection-observer";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useDebounce } from "use-debounce";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRoom } from "@/provider/DocumentRoomProvider";
//

//
import { documents } from "@/db/statements/document";

import { archiveDocType } from "@/utils/helper";

import { Button } from "@/components/ui/button";
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

//
import {
  CloudUpload,
  Search,
  Inbox,
  FileText,
  Calendar,
  ArchiveIcon,
  Loader2,
} from "lucide-react";

//
import type { ArchiveDocument } from "@/interface/data";

interface ListProps {
  list: ArchiveDocument[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Archive = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [text, setText] = useState("");
  const { lineId } = useParams();
  const auth = useAuth();
  const room = useRoom();
  const nav = useNavigate();

  const [debouncedText] = useDebounce(text, 500);

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryFn: ({ pageParam }) =>
        documents(
          auth.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
          debouncedText,
        ),
      queryKey: ["archived-documents", room.room?.id],
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      initialPageParam: null,
    });

  const list = data ? data.pages.flatMap((item) => item.list) : [];
  const isEmpty = !isFetching && list.length === 0;

  // Infinite scroll observer
  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  return (
    <div className="w-full h-full bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Archive</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and search archived documents
              </p>
            </div>
            <Button
              onClick={() => nav("new")}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <CloudUpload className="h-4 w-4 mr-2" strokeWidth={1.5} />
              New Document
            </Button>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="sticky top-[73px] z-10 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-md">
            {/* <InputGroup className="shadow-sm">
              <InputGroupAddon className="bg-white border-r">
                <Search className="h-4 w-4 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search by document title, ID, or content..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </InputGroup> */}
            <button
              onClick={() => setOnOpen(1)}
              className=" w-full p-2 flex gap-2 items-center border border-gray-200 rounded hover:border-gray-300 cursor-pointer"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <p className=" text-sm text-gray-600">
                Search by document title, ID, or content...
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="w-16 font-semibold text-gray-700">
                    No.
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Document ID
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Title
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 w-32">
                    Date Archived
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 w-24">
                    Retention
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 w-24">
                    Detention
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 w-24">
                    Type
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Loading State */}
                {isFetching && list.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                          <ArchiveIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="mt-4 text-gray-500 font-medium">
                          Loading archived documents...
                        </p>
                        <p className="text-sm text-gray-400">Please wait</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : /* Empty State */
                isEmpty ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="bg-gray-50 rounded-full p-4 mb-4">
                          <Inbox className="h-12 w-12" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          No archived documents found
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {text
                            ? "Try adjusting your search terms"
                            : "Archive documents will appear here"}
                        </p>
                        {text && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => setText("")}
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : /* Document List */
                list.length > 0 ? (
                  <>
                    {list.map((item, i) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => nav(item.id)}
                      >
                        <TableCell className="font-medium text-gray-500">
                          {(i + 1).toString().padStart(2, "0")}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-gray-600">
                            {item.id.slice(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span>Document {item.id.slice(0, 12)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            {new Date().toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Pending
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Active
                          </span>
                        </TableCell>
                        <TableCell>{archiveDocType[item.docType]}</TableCell>
                      </TableRow>
                    ))}

                    {/* Infinite Scroll Trigger */}
                    {hasNextPage && (
                      <TableRow ref={ref}>
                        <TableCell colSpan={6} className="py-4">
                          <div className="flex items-center justify-center">
                            {isFetchingNextPage ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                                <span className="text-sm text-gray-500">
                                  Loading more documents...
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-400">
                                Scroll for more
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ) : null}
              </TableBody>
            </Table>
          </div>

          {/* Stats Footer */}
          {list.length > 0 && !isFetching && (
            <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500">
              Showing {list.length} document{list.length !== 1 ? "s" : ""}
              {debouncedText && ` matching "${debouncedText}"`}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        title={undefined}
        children={
          <SearchArchive
            full={false}
            roomId={""}
            lineId={""}
            token={auth.token as string}
          />
        }
        onOpen={onOpen === 1}
        className={"  min-w-2xl max-h-11/12 overflow-auto"}
        footer={1}
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default Archive;
