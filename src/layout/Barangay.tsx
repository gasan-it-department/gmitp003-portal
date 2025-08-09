//layout and components
import {
  Select,
  SelectContent,
  SelectItem,
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
import { useQuery } from "@tanstack/react-query";
import { getAllMunicipalitiesBarangay } from "@/db/statement";
//interface
//interface
import type { Region } from "@/interface/data";
interface Props {
  selectComp: boolean;
  code: string;
}

const Barangay = ({ selectComp, code }: Props) => {
  const { data, isFetching } = useQuery<Region[]>({
    queryKey: ["barnagays"],
    queryFn: () => getAllMunicipalitiesBarangay(code),
    throwOnError: true,
  });

  if (isFetching) {
    return (
      <div className="">
        <span>Loading...</span>
      </div>
    );
  }

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
          <SelectValue placeholder="Select Province" />
        </SelectTrigger>
        <SelectContent>
          {data.map((item) => (
            <SelectItem key={item.code} value={item.code}>
              {item.regionName} ({item.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  return (
    <div className="">
      <Table>
        <TableHeader>
          {["No.", "Name", "Region Name", "Code"].map((item, i) => (
            <TableHead key={i}>{item}</TableHead>
          ))}
        </TableHeader>
        <TableBody>
          {data.map((item, i) => (
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

export default Barangay;
