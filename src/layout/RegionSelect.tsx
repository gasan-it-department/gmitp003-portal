//import React from "react";
import { useQuery } from "@tanstack/react-query";
//
import { getRegions } from "@/db/statement";
//
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

//
import type { Region } from "@/interface/data";
interface Props {
  onChange: (...event: any[]) => void;
  value: string;
}

const RegionSelect = ({ onChange, value }: Props) => {
  const { data, isFetching, error } = useQuery<Region[]>({
    queryKey: ["regions"],
    queryFn: getRegions,
  });

  return (
    <Select
      disabled={isFetching}
      onValueChange={(e) => onChange(e)}
      value={value}
    >
      <SelectTrigger className=" w-full bg-white">
        <SelectValue placeholder="Select Region" />
      </SelectTrigger>
      <SelectContent>
        {isFetching ? (
          <SelectItem value="loading">Loading...</SelectItem>
        ) : error ? (
          <SelectItem value="error">Error</SelectItem>
        ) : data ? (
          data.length > 0 ? (
            data.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="noData">No data found</SelectItem>
          )
        ) : (
          <SelectItem value="errors">Something went wrong</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default RegionSelect;
