import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
//
import type { Province } from "@/interface/data";

//props/schema/interface
import { getPSGSProvince } from "@/db/statement";

interface Props {
  onChange: (...event: any[]) => void;
  regionId: string | undefined;
  value: string;
}

const ProvinceSelect = ({ onChange, regionId, value }: Props) => {
  const { data, isFetching, refetch } = useQuery<Province[]>({
    queryKey: ["province"],
    queryFn: () => getPSGSProvince(regionId as string),
    enabled: !!regionId,
  });
  console.log(data);

  useEffect(() => {
    if (regionId) refetch();
  }, [regionId]);

  return (
    <Select onValueChange={onChange} value={value} disabled={!regionId}>
      <SelectTrigger className=" w-full bg-white">
        <SelectValue placeholder="Select Municipality" />
      </SelectTrigger>
      <SelectContent>
        {isFetching ? (
          <SelectItem value="loading">Loading</SelectItem>
        ) : data ? (
          data.length > 0 ? (
            data.map((item) => (
              <SelectItem value={item.code}>{item.name}</SelectItem>
            ))
          ) : (
            <SelectItem value="noData">No data found!</SelectItem>
          )
        ) : (
          <SelectItem value="error">Something went wrong</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default ProvinceSelect;
