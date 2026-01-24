import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

//
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { getDataSets } from "@/db/statement";
import { useParams } from "react-router";
//
import { type SuppliesDataSetProps } from "@/interface/data";
interface Props {
  className: string;
  handleChangeParams: (key: string, value: string) => void;
}

const SelectDataSet = ({ className, handleChangeParams }: Props) => {
  const auth = useAuth();
  const { containerId } = useParams();
  const { data, isFetching, isFetchingNextPage } = useInfiniteQuery<{
    list: SuppliesDataSetProps[];
    hasMore: boolean;
    lastCursor: string | null;
  }>({
    queryFn: ({ pageParam }) =>
      getDataSets(
        auth.token,
        pageParam as string | null,
        "20",
        containerId as string
      ),
    queryKey: ["data-set-list", containerId],
    initialPageParam: null,
    getNextPageParam: (last) => last.lastCursor,
  });
  if (!data) {
    return;
  }
  return (
    <Select onValueChange={(e) => handleChangeParams("dataSet", e)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select Data Set" />
      </SelectTrigger>
      <SelectContent>
        {data.pages.flatMap((item) => item.list).length > 0 ? (
          data.pages
            .flatMap((item) => item.list)
            .map((item) => (
              <SelectItem value={item.id} key={item.id}>
                {item.title}
              </SelectItem>
            ))
        ) : (
          <SelectItem value="none">None</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default SelectDataSet;
