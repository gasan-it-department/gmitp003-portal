//layout and components
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
//hooks and libs
import { useInfiniteQuery } from "@tanstack/react-query";
import { getAllRegion } from "@/db/statement";
//interface
//interface
import type { Region } from "@/interface/data";
interface Props {
  selectComp: boolean;
  source: number;
  token: string;
}

const Regions = ({ selectComp, source, token }: Props) => {
  const { data, fetchNextPage } = useInfiniteQuery<{
    list: Region[];
    hasMore: boolean;
    lastCursor: string | null;
  }>({
    queryKey: ["regions", source],
    queryFn: ({ pageParam }) =>
      getAllRegion(source, token, pageParam as string | null),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  console.log({ data });

  if (!data) {
    return (
      <div className="">
        <span>NO data found</span>
      </div>
    );
  }

  if (selectComp) {
    return (
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select Region" />
        </SelectTrigger>
        <SelectContent>
          {/* {data.list.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.regionName} ({item.name})
            </SelectItem>
          ))} */}
        </SelectContent>
      </Select>
    );
  }
  return (
    <div className="">
      <button onClick={() => fetchNextPage()}>Next</button>
      <Table>
        <TableHeader>
          {["No.", "Name", "Region Name", "Code"].map((item, i) => (
            <TableHead key={i}>{item}</TableHead>
          ))}
        </TableHeader>
        <TableBody>
          {data.pages
            .flatMap((page) => page.list)
            .map((item, i) => (
              <TableRow key={i} className=" cursor-pointer hover:bg-gray-200">
                <TableCell>{i + 1}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.regionName}</TableCell>
                <TableCell>{item.code}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Regions;
