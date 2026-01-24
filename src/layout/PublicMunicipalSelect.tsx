import { useEffect } from "react";

//
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//
import { getPSGCMunicipalities } from "@/db/statement";

//hooks/libs/

import { useQuery } from "@tanstack/react-query";

//

//interface/props/schema
import type { Municipal } from "@/interface/data";
interface Props {
  provinceId: string | undefined;
  onChange: (...event: any[]) => void;
  value: string;
}
const PublicMunicipalSelect = ({ provinceId, onChange, value }: Props) => {
  const { data, isFetching, refetch } = useQuery<Municipal[]>({
    queryKey: ["municipalities", provinceId],
    queryFn: () => getPSGCMunicipalities(provinceId as string),
  });

  useEffect(() => {
    if (provinceId) refetch();
  }, [provinceId]);

  return (
    <Select
      value={value}
      onValueChange={(e) => onChange(e)}
      disabled={!provinceId}
    >
      <SelectTrigger className=" w-full bg-white">
        <SelectValue placeholder="Select Municipality" />
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

export default PublicMunicipalSelect;
