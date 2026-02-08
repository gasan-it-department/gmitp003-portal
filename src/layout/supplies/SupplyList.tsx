import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SupplyList = () => {
  return (
    <div className=" w-full h-full">
      <div>
        <Select>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Select Data Set" />
          </SelectTrigger>
          <SelectContent></SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SupplyList;
