import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
//
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
//db
import { salaryGradeUsers } from "@/db/statements/salaryGrade";
//icons
import {
  Users,
  Loader2,
  ChevronDown,
  Search,
  Briefcase,
  Building2,
} from "lucide-react";

interface Props {
  salaryGradeId: string;
  token: string;
}

interface UserRow {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  profilePicture?: string | null;
  Position?: { name: string } | null;
  department?: { name: string } | null;
}

interface ListProps {
  list: UserRow[];
  hasMore: boolean;
  lastCursor: string | null;
}

const SalaryGradeUsersTab = ({ salaryGradeId, token }: Props) => {
  const { ref, inView } = useInView({ threshold: 0 });
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 500);

  const { data, isFetchingNextPage, fetchNextPage, hasNextPage, isFetching } =
    useInfiniteQuery<ListProps>({
      queryKey: ["salary-grade-users", salaryGradeId, query],
      queryFn: ({ pageParam }) =>
        salaryGradeUsers(
          token,
          salaryGradeId,
          pageParam as string | null,
          "20",
          query,
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      refetchOnWindowFocus: false,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((p) => p.list) ?? [];

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Search */}
      <div className="flex-none px-3 py-2 border-b bg-white">
        <InputGroup className="bg-white">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name or username..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-8 text-xs"
          />
        </InputGroup>
      </div>

      <div className="flex-1 overflow-auto">
        {isFetching && !allItems.length ? (
          <div className="w-full p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !allItems.length ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-300" />
            </div>
            <p className="text-xs font-medium text-gray-700">
              {query ? `No users match "${query}"` : "No users on this grade"}
            </p>
            <p className="text-[10px] text-gray-500 text-center max-w-[280px]">
              {query
                ? "Try a different search term."
                : "Employees assigned to this salary grade will appear here."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[200px]">
                  Employee
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  Position
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[160px]">
                  Department
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map((u) => (
                <TableRow key={u.id} className="hover:bg-gray-50/60">
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        {u.profilePicture && (
                          <AvatarImage
                            src={u.profilePicture}
                            alt={fullName(u)}
                          />
                        )}
                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700 font-semibold">
                          {initialsFor(u)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {fullName(u)}
                        </p>
                        {u.username && (
                          <p className="text-[10px] text-gray-500 truncate">
                            @{u.username}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {u.Position?.name ? (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        {u.Position.name}
                      </span>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 text-gray-400"
                      >
                        No position
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {u.department?.name ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {u.department.name}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {isFetchingNextPage && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-2">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-[10px]">Loading more...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {hasNextPage && !isFetchingNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={3} className="text-center py-2">
                    <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                      <ChevronDown className="h-3 w-3 animate-bounce" />
                      Scroll to load more
                    </span>
                  </TableCell>
                </TableRow>
              )}

              {!hasNextPage && allItems.length > 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-2 border-t text-[10px] text-gray-400"
                  >
                    Showing all {allItems.length} user
                    {allItems.length !== 1 ? "s" : ""}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

const initialsFor = (u: UserRow) => {
  const first = (u.firstName ?? "").trim();
  const last = (u.lastName ?? "").trim();
  const out = `${first ? first[0] : ""}${last ? last[0] : ""}`.toUpperCase();
  return out || (u.username?.[0]?.toUpperCase() ?? "?");
};

const fullName = (u: UserRow) => {
  const parts = [u.firstName, u.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : (u.username ?? "Unknown user");
};

export default SalaryGradeUsersTab;
