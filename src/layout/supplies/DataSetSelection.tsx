//
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DataSetSelection = () => {
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select Data Set" />
      </SelectTrigger>
    </Select>
  );
};

export default DataSetSelection;
