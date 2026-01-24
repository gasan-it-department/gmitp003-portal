import { useInfiniteQuery } from "@tanstack/react-query";
import { supplyQualities } from "@/db/statement";
import { useAuth } from "@/provider/ProtectedRoute";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import type { SuppliesQualityProps } from "@/interface/data";

interface Props {
  onChange: (...event: any[]) => void;
  value: any;
}
const SupplyQualit = ({ onChange, value }: Props) => {
  const auth = useAuth();
  const { data, isFetching } = useInfiniteQuery<{
    lastCursor: string | null;
    hasMore: boolean;
    list: SuppliesQualityProps[];
  }>({
    queryKey: ["quality"],
    queryFn: ({ pageParam }) =>
      supplyQualities(auth.token as string, pageParam as string | null, "20"),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });
  if (isFetching) {
    return <p>Loading...</p>;
  }
  if (!data) {
    return;
  }
  return (
    <Select onValueChange={(e) => onChange(e)}>
      <SelectTrigger value={value}>
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent>
        {data.pages.flatMap((item) => item.list).length > 0
          ? data.pages
              .flatMap((item) => item.list)
              .map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.quality}
                </SelectItem>
              ))
          : null}
      </SelectContent>
    </Select>
  );
};

export default SupplyQualit;
