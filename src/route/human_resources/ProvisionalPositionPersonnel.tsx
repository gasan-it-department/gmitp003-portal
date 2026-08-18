import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { provisionalPositionPersonnel } from "@/db/statement";
//
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Loader2,
  Users,
  UserRound,
  CalendarClock,
  Building2,
  AlertTriangle,
} from "lucide-react";

interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  username?: string | null;
  status: string;
  term?: string | null;
  createdAt: string;
  department?: { id: string; name: string } | null;
  SalaryGrade?: { id: string; grade: number; amount: number } | null;
}

interface PositionHeader {
  id: string;
  title: string;
  empType: string;
  termMonths: number;
  slots: number;
  filled: number;
  open: number;
  description?: string | null;
  salaryGrade?: { id: string; grade: number; amount: number } | null;
}

const fmtDate = (v?: string | null) =>
  v
    ? new Date(v).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

/** Contract end date, coloured by how close it is. */
const TermBadge = ({ term }: { term?: string | null }) => {
  if (!term)
    return (
      <span className="text-xs text-gray-400">No end date</span>
    );
  const end = new Date(term);
  const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  const tone =
    days < 0
      ? "bg-red-50 text-red-700 border-red-200"
      : days <= 30
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <Badge variant="outline" className={`text-[10px] px-2 ${tone}`}>
      <CalendarClock className="h-2.5 w-2.5 mr-1" />
      {days < 0 ? "Ended " : "Until "}
      {fmtDate(term)}
    </Badge>
  );
};

const ProvisionalPositionPersonnel = () => {
  const auth = useAuth();
  const token = auth.token as string;
  const { lineId, positionId } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [debounced] = useDebounce(search, 400);
  const { ref, inView } = useInView();

  const people = useInfiniteQuery({
    queryKey: ["prov-position-personnel", positionId, debounced],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      provisionalPositionPersonnel(
        token,
        lineId as string,
        positionId as string,
        pageParam,
        "20",
        debounced,
      ),
    getNextPageParam: (last: any) => (last?.hasMore ? last?.lastCursor : undefined),
    enabled: !!token && !!lineId && !!positionId,
  });

  // Infinite scroll: pull the next page as the sentinel scrolls into view.
  useEffect(() => {
    if (inView && people.hasNextPage && !people.isFetchingNextPage) {
      people.fetchNextPage();
    }
  }, [inView, people.hasNextPage, people.isFetchingNextPage]);

  const pages = (people.data?.pages ?? []) as any[];
  const position = (pages[0]?.position ?? null) as PositionHeader | null;
  const list = pages.flatMap((p) => (p?.list ?? []) as Personnel[]);

  const fullName = (u: Personnel) =>
    `${u.lastName}, ${u.firstName}${u.middleName ? ` ${u.middleName[0]}.` : ""}`;

  return (
    <div className="w-full h-full bg-gray-50">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            type="button"
            onClick={() => navigate(`/${lineId}/human-resources/provisional`)}
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Non-Plantilla positions
          </button>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 flex-shrink-0">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {position?.title ?? "Position"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Everyone hired into this position.
                  {position
                    ? ` ${position.termMonths}-month term.`
                    : ""}
                </p>
              </div>
            </div>

            {position && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-1 ${
                    position.open === 0
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  <Users className="h-3 w-3 mr-1.5" />
                  {position.filled} filled / {position.slots} slots
                </Badge>
                {position.salaryGrade && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border-emerald-200"
                  >
                    SG {position.salaryGrade.grade} · ₱
                    {position.salaryGrade.amount.toLocaleString("en-PH")}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* ── Search ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border shadow-sm p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this position's personnel by name…"
              className="pl-9 h-10"
            />
          </div>
        </div>

        {/* ── People ───────────────────────────────────────────────────── */}
        {people.isLoading ? (
          <div className="bg-white rounded-lg border shadow-sm p-16 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : people.isError ? (
          <div className="bg-white rounded-lg border shadow-sm p-10 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-amber-500" />
            <p className="mt-3 text-sm font-medium text-gray-900">
              Could not load this position
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => people.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div className="bg-white rounded-lg border shadow-sm flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="bg-gray-50 rounded-full p-4 mb-4">
              <UserRound className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
            </div>
            <p className="text-gray-500 font-medium">
              {debounced ? "Nobody matches that search" : "Nobody hired yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              {debounced
                ? "Try a different name."
                : "Use Select applicant on the positions list to hire into this post."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden divide-y">
            {list.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() =>
                  navigate(`/${lineId}/human-resources/employee/${u.id}`)
                }
                className="w-full text-left px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors duration-150 flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 flex-shrink-0">
                  <UserRound className="h-5 w-5 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {fullName(u)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-2 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {u.status}
                    </Badge>
                    <TermBadge term={u.term} />
                    {u.department && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {u.department.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Hired {fmtDate(u.createdAt)}
                    {u.username ? ` · ${u.username}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Infinite-scroll sentinel */}
        {people.hasNextPage && (
          <div ref={ref} className="py-4 text-center">
            {people.isFetchingNextPage ? (
              <Loader2 className="h-5 w-5 animate-spin inline text-gray-400" />
            ) : (
              <span className="text-xs text-gray-400">Scroll for more</span>
            )}
          </div>
        )}
        {!people.hasNextPage && list.length > 0 && (
          <p className="text-center text-xs text-gray-400 py-2">
            {list.length} {list.length === 1 ? "person" : "people"} — end of list
          </p>
        )}
      </div>
    </div>
  );
};

export default ProvisionalPositionPersonnel;
