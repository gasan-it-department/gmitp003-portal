import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
//
import { useAuth } from "@/provider/ProtectedRoute";
import { pesoJobList } from "@/db/statements/peso";
import PesoJobItem from "./item/PesoJobItem";
//
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
//
import { Search, Plus, Briefcase } from "lucide-react";
import type { JobPostProps } from "@/interface/data";

interface ListProps {
  list: JobPostProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const PesoHome = () => {
  const { lineId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 800);
  const { ref, inView } = useInView();

  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["peso-jobs", lineId, query],
    queryFn: ({ pageParam }) =>
      pesoJobList(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!auth.token && !!lineId,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const jobs = data?.pages.flatMap((p) => p.list) ?? [];

  return (
    <div className="w-full min-h-full p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">External Jobs</h1>
            <p className="text-sm text-gray-600">
              Post and manage private-sector / external vacancies
            </p>
          </div>
          <Button onClick={() => nav("post")} className="gap-2">
            <Plus className="h-4 w-4" />
            Post external job
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <InputGroup className="w-full">
            <InputGroupAddon>
              <Search className="h-4 w-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by job title or employer..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </InputGroup>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((item) => (
              <PesoJobItem key={item.id} item={item} query={query} />
            ))}
            <div ref={ref} className="h-10 flex justify-center items-center">
              {isFetchingNextPage && <Spinner className="h-5 w-5" />}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No external jobs yet
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {query
                ? "No posts match your search."
                : "Create your first external/private-sector job posting."}
            </p>
            {!query && (
              <Button onClick={() => nav("post")} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Post external job
              </Button>
            )}
          </div>
        )}

        {isFetching && !isFetchingNextPage && !isLoading && (
          <div className="flex justify-center py-6">
            <Spinner className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PesoHome;
