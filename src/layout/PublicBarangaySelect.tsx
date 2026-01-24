import { useEffect } from "react";

//hooks/libs/db
import { getPSGCbarangays } from "@/db/statement";
import { useQuery } from "@tanstack/react-query";
//
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";

//interface/props/schema
import type { Barangay } from "@/interface/data";

interface Props {
  municipalityId: string | undefined;
  onChange: (...event: any[]) => void;
  value: string;
}

const PublicBarangaySelect = ({ municipalityId, onChange, value }: Props) => {
  const { data, isFetching, refetch } = useQuery<Barangay[]>({
    queryKey: ["barangays", municipalityId],
    queryFn: () => getPSGCbarangays(municipalityId as string),
    enabled: !!municipalityId,
  });

  useEffect(() => {
    if (municipalityId) refetch();
  }, [municipalityId]);
  return (
    <Select
      value={value}
      onValueChange={(e) => onChange(e)}
      disabled={!municipalityId}
    >
      <SelectTrigger className=" w-full bg-white">
        <SelectValue placeholder="Select Barangay" />
      </SelectTrigger>
      <SelectContent>
        {isFetching ? (
          <SelectItem value="loading">Loading...</SelectItem>
        ) : data ? (
          data.length > 0 ? (
            data.map((item) => (
              <SelectItem value={item.code} key={item.code}>
                {item.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="noData">No Data found</SelectItem>
          )
        ) : (
          <SelectItem value="error">Something went wrong</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default PublicBarangaySelect;
