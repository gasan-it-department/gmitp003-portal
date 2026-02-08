import { useEffect } from "react";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { getDataSets } from "@/db/statement";
import { useParams } from "react-router";
import { useInView } from "react-intersection-observer"; // Add this import
import { Spinner } from "@/components/ui/spinner"; // Add this import
//
import { type SuppliesDataSetProps } from "@/interface/data";

interface Props {
  className: string;
  handleChangeParams: (key: string, value: string) => void;
}

const SelectDataSet = ({ className, handleChangeParams }: Props) => {
  const auth = useAuth();
  const { containerId } = useParams();
  const { ref, inView } = useInView(); // Add this hook

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<{
      list: SuppliesDataSetProps[];
      hasMore: boolean;
      lastCursor: string | null;
    }>({
      queryFn: ({ pageParam }) =>
        getDataSets(
          auth.token,
          pageParam as string | null,
          "20",
          containerId as string,
        ),
      queryKey: ["data-set-list", containerId],
      initialPageParam: null,
      getNextPageParam: (last) => (last.hasMore ? last.lastCursor : undefined), // Fixed this line
    });

  // Add infinite scroll trigger effect
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!data) {
    return null;
  }

  const allDataSets = data.pages.flatMap((item) => item.list);
  const totalCount = allDataSets.length;
  const isEmpty = totalCount === 0;
  const isLoading = isFetching && !isFetchingNextPage && isEmpty;

  return (
    <Select onValueChange={(e) => handleChangeParams("dataSet", e)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select Data Set" />
        {totalCount > 0 && !isLoading && (
          <span className="ml-auto text-xs text-gray-500">
            {totalCount} available
          </span>
        )}
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {/* Header */}
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium text-gray-900">Data Sets</p>
          <p className="text-xs text-gray-500">
            {isEmpty
              ? "No data sets"
              : `${totalCount} data set${totalCount !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Spinner className="w-5 h-5" />
              <p className="text-sm text-gray-500">Loading data sets...</p>
            </div>
          </div>
        ) : !isEmpty ? (
          <div className="max-h-[250px] overflow-y-auto">
            {allDataSets.map((item) => (
              <SelectItem value={item.id} key={item.id} className="py-2">
                {item.title}
              </SelectItem>
            ))}

            {/* Infinite scroll trigger */}
            <div ref={ref} className="h-2" />

            {/* Loading more indicator */}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-2 gap-2">
                <Spinner className="w-4 h-4" />
                <span className="text-xs text-gray-500">Loading more...</span>
              </div>
            )}

            {/* End of list indicator */}
            {!hasNextPage && totalCount > 0 && (
              <div className="px-3 py-2 text-center border-t">
                <p className="text-xs text-gray-400">All data sets loaded</p>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No data sets available</p>
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default SelectDataSet;
