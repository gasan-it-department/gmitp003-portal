import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAdminAuth } from "@/provider/AdminRouter";
import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "react-router";
import { toast } from "sonner";

import { getAccounts, setAccountStatus, deleteAccount } from "@/db/statement";
import type { AccountProps } from "@/interface/data";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  Loader2,
  UserCircle,
  Mail,
  MoreVertical,
  Ban,
  CircleCheck,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface LoadProps {
  list: AccountProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const isActive = (a: AccountProps) => a.active ?? a.status === 1;

const StatusBadge = ({ active }: { active: boolean }) => (
  <Badge
    variant="outline"
    className={
      "text-[10px] px-2 py-0 " +
      (active
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-red-50 text-red-700 border-red-200")
    }
  >
    <span
      className={
        "mr-1 inline-block h-1.5 w-1.5 rounded-full " +
        (active ? "bg-emerald-500" : "bg-red-500")
      }
    />
    {active ? "Active" : "Suspended"}
  </Badge>
);

const Account = () => {
  const [selected, setSelected] = useState<AccountProps | null>(null);
  const [toDelete, setToDelete] = useState<AccountProps | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState("all");
  const [params, setParams] = useSearchParams({ query: "" });
  const admin = useAdminAuth();
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const currentQuery = params.get("query") || "";

  const {
    data,
    isFetchingNextPage,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery<LoadProps>({
    queryFn: ({ pageParam }) =>
      getAccounts(
        admin.token,
        pageParam as string | null,
        20,
        currentQuery,
        filter === "all" ? undefined : filter,
      ),
    queryKey: ["account", currentQuery, filter],
    getNextPageParam: (lastPage) => lastPage.lastCursor,
    initialPageParam: null,
  });

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      { replace: true },
    );
  };

  const debounced = useDebouncedCallback((value) => {
    handleChangeParams("query", value);
  }, 600);

  useEffect(() => {
    refetch();
  }, [currentQuery, filter]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const accounts = data?.pages.flatMap((item) => item.list) || [];
  const totalCount = accounts.length;

  const initials = (a: AccountProps) => {
    const f = a.User?.firstName?.[0] ?? a.username?.[0] ?? "?";
    const l = a.User?.lastName?.[0] ?? "";
    return (f + l).toUpperCase();
  };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["account"] });

  const toggleSuspend = async (a: AccountProps) => {
    setBusyId(a.id);
    try {
      const next = !isActive(a);
      await setAccountStatus(admin.token, a.id, next);
      toast.success(next ? "Account reactivated" : "Account suspended");
      refresh();
    } catch (e) {
      toast.error("Failed to update account", { description: `${e}` });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteAccount(admin.token, toDelete.id);
      toast.success("Account deleted");
      setToDelete(null);
      refresh();
    } catch (e: any) {
      const msg = e?.response?.data?.message || `${e}`;
      toast.error("Failed to delete account", { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-3 md:p-5 gap-3">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-none">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by username or name…"
            defaultValue={currentQuery}
            onChange={(e) => debounced(e.target.value)}
            className="pl-9 h-9 bg-white"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9 w-full sm:w-44 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">
              All accounts
            </SelectItem>
            <SelectItem value="hrmo" className="text-sm">
              HRMO only
            </SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-[10px] sm:ml-auto">
          <Users className="h-3 w-3 mr-1" />
          {totalCount} {totalCount === 1 ? "account" : "accounts"}
        </Badge>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 rounded-xl border bg-white overflow-auto">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-12 text-[11px] font-semibold text-gray-600">
                #
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600">
                Account
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600 hidden md:table-cell">
                Name
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600 hidden lg:table-cell">
                Email
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600 w-28">
                Status
              </TableHead>
              <TableHead className="text-[11px] font-semibold text-gray-600 w-12 text-right">
                {""}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && accounts.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-44" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                </TableRow>
              ))
            ) : accounts.length > 0 ? (
              accounts.map((item, i) => {
                const active = isActive(item);
                return (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                    onClick={() => setSelected(item)}
                  >
                    <TableCell className="font-mono text-[11px] text-gray-400">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-[10px] font-semibold">
                          {initials(item)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                          {item.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-700">
                      {item.User
                        ? `${item.User.firstName ?? ""} ${item.User.lastName ?? ""}`.trim() ||
                          "—"
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {item.User?.email ? (
                        <span className="text-sm text-gray-600 inline-flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {item.User.email}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={active} />
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={busyId === item.id}
                          >
                            {busyId === item.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-1" align="end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-8 text-[11px] gap-2"
                            onClick={() => toggleSuspend(item)}
                          >
                            {active ? (
                              <>
                                <Ban className="h-3.5 w-3.5 text-amber-600" />
                                Suspend
                              </>
                            ) : (
                              <>
                                <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Reactivate
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-8 text-[11px] gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setToDelete(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Users className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="font-medium text-sm">No accounts found</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {currentQuery
                        ? `No results match “${currentQuery}”`
                        : filter === "hrmo"
                          ? "No HRMO accounts found"
                          : "No accounts have been created yet"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {isFetchingNextPage && (
              <TableRow>
                <TableCell colSpan={6} className="py-3">
                  <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Loading more…
                  </div>
                </TableCell>
              </TableRow>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <TableRow ref={ref}>
                <TableCell colSpan={6} className="py-2 text-center">
                  <span className="text-[10px] text-gray-400">
                    Scroll for more
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Account Details
              </h2>
              <p className="text-sm text-gray-500">Read-only overview</p>
            </div>
          </div>
        }
        onOpen={!!selected}
        className="max-w-lg"
        setOnOpen={() => setSelected(null)}
        footer={true}
        cancelTitle="Close"
      >
        {selected && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                {initials(selected)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {selected.User
                    ? `${selected.User.firstName ?? ""} ${selected.User.lastName ?? ""}`.trim() ||
                      selected.username
                    : selected.username}
                </p>
                <p className="text-xs text-gray-500">@{selected.username}</p>
              </div>
              <div className="ml-auto">
                <StatusBadge active={isActive(selected)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-gray-50 p-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  First name
                </p>
                <p className="text-sm text-gray-800">
                  {selected.User?.firstName ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  Last name
                </p>
                <p className="text-sm text-gray-800">
                  {selected.User?.lastName ?? "—"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">
                  Email
                </p>
                <p className="text-sm text-gray-800 flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-gray-400" />
                  {selected.User?.email ?? "—"}
                </p>
              </div>
            </div>

            {!selected.User && (
              <p className="text-[11px] text-amber-600">
                This account isn't linked to an employee profile yet.
              </p>
            )}
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Delete account
          </div>
        }
        onOpen={!!toDelete}
        className="max-w-md"
        setOnOpen={() => {
          if (!deleting) setToDelete(null);
        }}
        onFunction={confirmDelete}
        loading={deleting}
        yesTitle="Delete permanently"
        cancelTitle="Cancel"
        footer={true}
      >
        {toDelete && (
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              Permanently delete{" "}
              <span className="font-semibold">@{toDelete.username}</span>
              {toDelete.User
                ? ` (${`${toDelete.User.firstName ?? ""} ${toDelete.User.lastName ?? ""}`.trim()})`
                : ""}
              ?
            </p>
            <div className="rounded-md bg-red-50 border border-red-100 p-2.5">
              <p className="text-[11px] text-red-700">
                This removes the account <strong>and the linked employee
                record</strong> (logs and related data). This cannot be undone.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Account;
