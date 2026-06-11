import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";

import { jobPost } from "@/db/statement";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Search,
  Briefcase,
  Loader2,
  AlertCircle,
  Building2,
  X,
} from "lucide-react";

import JobPostItem from "./item/JobPostItem";

import type { JobPostProps } from "@/interface/data";

interface Municipality {
  id: string;
  name: string;
  Province?: { id: string; name: string } | null;
}

interface ListProps {
  list: JobPostProps[];
  hasMore: boolean;
  lastCursor: string | null;
  municipality?: Municipality | null;
  debug?: {
    totalForMuni: number;
    publishedForMuni: number;
    requestedMuni?: string;
    publishedMunis?: string[];
  };
}

const JobPost = () => {
  const { municipalId } = useParams();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 600);

  const {
    data,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["post-job", municipalId, query],
    queryFn: ({ pageParam }) =>
      jobPost(municipalId, pageParam as string | null, "20", query),
    initialPageParam: null,
    getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined),
    enabled: !!municipalId,
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
  const municipality = data?.pages[0]?.municipality ?? null;
  const debug = data?.pages[0]?.debug;

  if (!municipalId) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-3">
        <div className="border rounded-lg bg-white p-6 text-center max-w-sm w-full">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-800">
            Missing municipality
          </p>
          <p className="text-[10px] text-gray-500 mt-1">
            The link is missing the required municipality identifier.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-4xl mx-auto p-3 space-y-3">

        {/* Header card */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
                <Briefcase className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-gray-900 truncate">
                  Job Postings
                </h1>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5 flex items-center gap-1">
                  <Building2 className="h-2.5 w-2.5" />
                  {municipality
                    ? `${municipality.name}${
                        municipality.Province?.name
                          ? `, ${municipality.Province.name}`
                          : ""
                      }`
                    : "Browse open positions in this municipality"}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
              {items.length} job{items.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="p-2 flex items-center gap-1.5">
            <InputGroup className="flex-1 bg-white">
              <InputGroupAddon>
                <Search className="h-3 w-3 text-gray-400" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search position, unit, or description..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-8 text-xs"
              />
            </InputGroup>
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setText("")}
                className="h-7 text-[10px] gap-1 text-gray-500"
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {isError ? (
            <div className="border rounded-lg bg-white p-6 text-center">
              <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-red-600">
                Failed to load
              </p>
              <p className="text-[10px] text-gray-500 mt-1">
                {(error as any)?.message ?? "Try again later."}
              </p>
            </div>
          ) : isFetching && items.length === 0 ? (
            <div className="border rounded-lg bg-white p-8 flex items-center justify-center">
              <div className="flex items-center gap-1.5 text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-[10px]">Loading job posts...</span>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="border rounded-lg bg-white border-dashed py-12 text-center px-4">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-gray-300" />
              </div>
              <h3 className="text-xs font-semibold text-gray-700">
                No job posts found
              </h3>
              <p className="text-[10px] text-gray-500 mt-1 max-w-[320px] mx-auto">
                {query
                  ? "No posts match your search. Try different keywords."
                  : debug && debug.totalForMuni > 0 && debug.publishedForMuni === 0
                    ? `This municipality has ${debug.totalForMuni} draft posting${debug.totalForMuni === 1 ? "" : "s"} — none are published yet.`
                    : debug && debug.publishedForMuni > 0
                      ? "Published postings exist but appear to be past their deadline."
                      : debug && debug.totalForMuni === 0 && (debug.publishedMunis?.length ?? 0) > 0
                        ? `No postings tagged to this municipality. Published posts exist under different municipalities — check that you opened the right link.`
                        : "There are currently no open positions for this municipality."}
              </p>
              {debug && (
                <div className="mt-3 text-[10px] text-gray-400 space-y-0.5 font-mono">
                  <p>Requested muni: {debug.requestedMuni ?? "—"}</p>
                  <p>
                    Posts in this muni: {debug.totalForMuni} total,{" "}
                    {debug.publishedForMuni} published
                  </p>
                  {debug.publishedMunis && debug.publishedMunis.length > 0 && (
                    <p className="break-all">
                      Published muni IDs in DB:{" "}
                      {debug.publishedMunis.join(", ")}
                    </p>
                  )}
                </div>
              )}
              {debug?.totalForMuni === 0 &&
                debug.publishedMunis &&
                debug.publishedMunis.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5 items-center">
                    <p className="text-[10px] text-gray-500">
                      Try one of these instead:
                    </p>
                    {debug.publishedMunis.map((m) => (
                      <Button
                        key={m}
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-mono"
                        onClick={() => {
                          window.location.href = `/job-post/${m}`;
                        }}
                      >
                        /job-post/{m}
                      </Button>
                    ))}
                  </div>
                )}
              {query && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setText("")}
                  className="h-7 text-[10px] mt-3"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <>
              {items.map((item) => (
                <JobPostItem key={item.id} item={item} query={query} />
              ))}

              {hasNextPage && (
                <div ref={ref} className="flex justify-center py-2">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-1.5 bg-white border rounded-full px-3 py-1">
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                      <span className="text-[10px] text-gray-600">
                        Loading more...
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      Scroll to load more
                    </span>
                  )}
                </div>
              )}

              {!hasNextPage && items.length > 0 && (
                <div className="text-center py-3">
                  <span className="text-[10px] text-gray-400">
                    Showing all {items.length} job{items.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobPost;
