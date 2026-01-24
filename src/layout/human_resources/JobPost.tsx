import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
//db/statements
import { jobPost } from "@/db/statement";
//components
import JobPostItem from "./item/JobPostItem";
import { Spinner } from "@/components/ui/spinner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
//icons
import { Search, Briefcase } from "lucide-react";

//utils
//
import type { JobPostProps } from "@/interface/data";
interface ListProps {
  list: JobPostProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const JobPost = () => {
  const { municipalId } = useParams();
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { ref, inView } = useInView();

  const {
    data,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
    hasNextPage,
    refetch,
    isLoading,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["post-job", municipalId, query],
    queryFn: ({ pageParam }) =>
      jobPost(municipalId, pageParam as string | null, "20", query),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  const allJobs = data?.pages.flatMap((page) => page.list) || [];
  const totalJobs = allJobs.length;

  if (!municipalId) {
    return (
      <div className=" w-full h-screen">
        <p>INVALID REQUIRED ID</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className=" sticky top-0 mb-8 bg-background">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Job Posts</h1>
          </div>
          <p className="text-gray-600 mb-6">
            Browse and manage available job positions
          </p>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 ">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <InputGroup className="w-full">
                  <InputGroupAddon>
                    <Search className="h-4 w-4" />
                  </InputGroupAddon>
                  <InputGroupInput
                    placeholder="Search job..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full"
                  />
                </InputGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        {!isLoading && (
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {totalJobs > 0
                ? `Showing ${totalJobs} job post${totalJobs !== 1 ? "s" : ""}`
                : "No job posts found"}
            </p>
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setText("")}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear search
              </Button>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Spinner className="h-8 w-8 mx-auto mb-4" />
              <p className="text-gray-600">Loading job posts...</p>
            </div>
          </div>
        )}

        {/* Job Posts Grid */}
        {!isLoading && (
          <div className="space-y-4">
            {allJobs.length > 0 ? (
              <>
                {allJobs.map((item) => (
                  <JobPostItem key={item.id} item={item} query={query} />
                ))}

                {/* Load More Trigger */}
                <div
                  ref={ref}
                  className="h-10 flex justify-center items-center"
                >
                  {isFetchingNextPage && (
                    <div className="flex items-center gap-2 py-4">
                      <Spinner className="h-5 w-5" />
                      <span className="text-sm text-gray-600">
                        Loading more jobs...
                      </span>
                    </div>
                  )}
                </div>

                {/* No more posts to load */}
                {!hasNextPage && allJobs.length > 5 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      You've reached the end of the list
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No job posts found
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  {query
                    ? "No job posts match your search criteria. Try different keywords."
                    : "There are currently no job posts available. Check back later."}
                </p>
                {query && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setText("")}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Initial Loading */}
        {isFetching && !isFetchingNextPage && (
          <div className="flex justify-center items-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
};

export default JobPost;
