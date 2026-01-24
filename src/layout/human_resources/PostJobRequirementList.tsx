import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
//
import { postJobRequirementList } from "@/db/statement";
//
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import PostJobRequirementItem from "./item/PostJobRequirementItem";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, AlertCircle, RefreshCw } from "lucide-react";
//
import type { JobPostRequirementsProps } from "@/interface/data";
interface Props {
  postJobId: string;
  token: string;
  disabled: boolean;
}

interface ListProps {
  list: JobPostRequirementsProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const PostJobRequirementList = ({ postJobId, token, disabled }: Props) => {
  const { ref, inView } = useInView();
  const {
    data,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["jobPostRequirements", postJobId],
    queryFn: ({ pageParam }) =>
      postJobRequirementList(
        token,
        postJobId,
        pageParam as string | null,
        "10",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage().catch((error) => {
        console.error("Error fetching next page:", error);
        toast.error("Failed to load more items");
      });
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  const allRequirements = data?.pages.flatMap((item) => item.list) || [];
  const totalRequirements = allRequirements.length;

  if (isFetching && !data) {
    return (
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner className="w-8 h-8 mb-4 text-blue-600" />
            <p className="text-gray-600 font-medium">Loading requirements...</p>
            <p className="text-sm text-gray-500 mt-1">
              Please wait while we fetch the data
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
            <p className="text-red-800 font-medium mb-2">
              Failed to load requirements
            </p>
            <p className="text-red-600 text-sm">
              Please try refreshing the page
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header with count */}
      {allRequirements.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {totalRequirements} requirement
              {totalRequirements !== 1 ? "s" : ""}
            </span>
          </div>
          {isFetching && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
              <span className="text-xs text-gray-500">Updating...</span>
            </div>
          )}
        </div>
      )}

      {/* Requirements List */}
      <div className="space-y-3">
        {allRequirements.length > 0 ? (
          <>
            {allRequirements.map((item, i) => (
              <PostJobRequirementItem
                disabled={disabled}
                key={item.id}
                item={item}
                no={i}
                token={token}
              />
            ))}

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-full">
                  <Spinner className="w-4 h-4" />
                  <span className="text-sm text-gray-600">
                    Loading more requirements...
                  </span>
                </div>
              </div>
            )}

            {/* Infinite scroll trigger */}
            {hasNextPage && !isFetchingNextPage && (
              <div ref={ref} className="h-4" />
            )}
          </>
        ) : (
          <Card className="border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium mb-2">
                  No requirements added
                </p>
                <p className="text-gray-500 text-sm">
                  Get started by adding the first requirement to this job post
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom loading state for initial load with existing data */}
      {isFetching && allRequirements.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <Spinner className="w-4 h-4" />
            <span className="text-sm text-gray-500">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostJobRequirementList;
