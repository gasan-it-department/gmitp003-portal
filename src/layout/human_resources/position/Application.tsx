import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

import { positionApplication } from "@/db/statements/position";
import { deleteSelctedApplication } from "@/db/statements/application";

import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";
import ContactApplicant from "@/layout/human_resources/ContactApplicant";
import ApplicationItem from "@/layout/human_resources/item/ApplicationItem";

import {
  Search,
  Square,
  SquareCheckBig,
  PhoneForwarded,
  Trash2,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";

import type { SubmittedApplicationProps } from "@/interface/data";

interface Props {
  /** UnitPosition.id — filter the application list to this position only. */
  unitPositionId: string;
  token: string;
  userId: string;
  lineId: string;
}

interface ListProps {
  list: SubmittedApplicationProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

/**
 * Applications tab inside PositionDetail. Drops the line-wide filters
 * (date / position / tags) since the list is already pinned to one
 * unitPositionId — only a search + bulk-select + bulk-contact / delete
 * are useful here.
 *
 * Was previously a 5-line stub (`return <div>Application</div>`); now
 * mirrors the line-level Application list against /position/applications.
 */
const Application = ({ unitPositionId, token, userId, lineId }: Props) => {
  const queryClient = useQueryClient();

  const [text, setText] = useState("");
  const [onOpen, setOnOpen] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [onMultiSelect, setOnMultiSelect] = useState(false);
  const [query] = useDebounce(text, 600);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["position-applications", unitPositionId],
    queryFn: ({ pageParam }) =>
      positionApplication(
        token,
        unitPositionId,
        (pageParam as string) ?? "",
        "20",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!token && !!unitPositionId,
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

  // Client-side substring filter so search feels instant; the API doesn't
  // accept ?query on this endpoint and adding it server-side is a bigger
  // change than this small UI needs.
  const allItems = data?.pages.flatMap((p) => p.list) ?? [];
  const items = query.trim()
    ? allItems.filter((a) =>
        `${a.firstname ?? ""} ${a.lastname ?? ""} ${a.email ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : allItems;

  // Stop infinite-scroll firing while a filter is active — otherwise we'd
  // keep pulling pages the user can't see.
  useEffect(() => {
    if (!query.trim()) return;
  }, [query]);

  const handleCheckSelected = (id: string) => selected.includes(id);
  const handleAddSelected = (id: string) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );

  const deleteMut = useMutation({
    mutationFn: () =>
      deleteSelctedApplication(token, selected, userId, lineId),
    onSuccess: () => {
      setSelected([]);
      setOnMultiSelect(false);
      setOnOpen(0);
      queryClient.invalidateQueries({
        queryKey: ["position-applications", unitPositionId],
      });
      toast.success("Applications deleted");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Delete failed"),
      );
    },
  });

  const statusColor = (s: number) => {
    if (s === 0) return "bg-amber-50 text-amber-700 border-amber-200";
    if (s === 1) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-wrap flex-shrink-0">
        <InputGroup className="bg-white flex-1 min-w-[180px] max-w-sm">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search applicant name or email..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>

        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {items.length} loaded
          {selected.length > 0 && ` · ${selected.length} selected`}
        </Badge>

        <div className="flex-1" />

        <Button
          size="sm"
          variant={onMultiSelect ? "default" : "outline"}
          onClick={() => {
            setOnMultiSelect((v) => !v);
            if (onMultiSelect) setSelected([]);
          }}
          className="h-7 text-[10px] gap-1.5"
        >
          {onMultiSelect ? (
            <SquareCheckBig className="h-3 w-3" />
          ) : (
            <Square className="h-3 w-3" />
          )}
          {onMultiSelect ? "Cancel" : "Select"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={selected.length === 0}
          onClick={() => setOnOpen(2)}
          className="h-7 text-[10px] gap-1.5"
        >
          <PhoneForwarded className="h-3 w-3" />
          Contact ({selected.length})
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={selected.length === 0}
          onClick={() => setOnOpen(3)}
          className="h-7 text-[10px] gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              {onMultiSelect && (
                <TableHead className="w-10 text-[10px] font-semibold text-gray-700">
                  <SquareCheckBig className="h-3 w-3" />
                </TableHead>
              )}
              <TableHead className="w-10 text-[10px] font-semibold text-gray-700">
                No
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                Position
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                Applicant
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[110px]">
                Date Filed
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell
                  colSpan={onMultiSelect ? 6 : 5}
                  className="text-center py-8"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-[10px] font-medium text-red-600">
                      Failed to load applications
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {(error as any)?.message ?? "Try again later."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : isFetching && items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={onMultiSelect ? 6 : 5}
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center gap-1.5 text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[10px]">Loading applications...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={onMultiSelect ? 6 : 5}
                  className="text-center py-10"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-xs font-medium text-gray-700">
                      No applications for this position
                    </p>
                    <p className="text-[10px] text-gray-500 max-w-[260px]">
                      {query
                        ? "Try a different search term."
                        : "Applications submitted for this position will appear here."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, i) => (
                <ApplicationItem
                  key={item.id}
                  item={item}
                  no={i + 1}
                  query={query}
                  onMultiSelect={onMultiSelect}
                  handleCheckSelected={handleCheckSelected}
                  handleAddSelected={handleAddSelected}
                  token={token}
                  userId={userId}
                  lineId={lineId}
                  statusColor={statusColor}
                />
              ))
            )}

            {hasNextPage && !query.trim() && (
              <TableRow ref={ref}>
                <TableCell
                  colSpan={onMultiSelect ? 6 : 5}
                  className="text-center py-2"
                >
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
            {!hasNextPage && items.length > 0 && (
              <TableRow>
                <TableCell
                  colSpan={onMultiSelect ? 6 : 5}
                  className="text-center py-2 border-t text-[10px] text-gray-400"
                >
                  Showing all {items.length} record
                  {items.length !== 1 ? "s" : ""}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Contact modal */}
      <Modal
        footer={1}
        title={
          <div className="flex items-center gap-1.5 text-xs">
            <PhoneForwarded className="h-3 w-3 text-blue-500" />
            Contact Applicants ({selected.length})
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-2xl max-h-[90vh] overflow-auto"
        setOnOpen={() => setOnOpen(0)}
      >
        <ContactApplicant
          token={token}
          setOnOpen={setOnOpen}
          applicationId=""
          ids={selected}
          many={0}
        />
      </Modal>

      {/* Delete confirm */}
      <Modal
        title={undefined}
        onOpen={onOpen === 3}
        className=""
        setOnOpen={() => {
          if (!deleteMut.isPending) setOnOpen(0);
        }}
        footer={1}
      >
        <ConfirmDelete
          title={`Delete ${selected.length} application${selected.length === 1 ? "" : "s"}`}
          confirmation="confirm"
          setOnOpen={() => {
            if (!deleteMut.isPending) setOnOpen(0);
          }}
          onFunction={() => {
            if (!deleteMut.isPending) deleteMut.mutateAsync();
          }}
          isLoading={deleteMut.isPending}
        />
      </Modal>
    </div>
  );
};

export default Application;
