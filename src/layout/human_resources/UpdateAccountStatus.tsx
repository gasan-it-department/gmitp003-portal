import {} from "react";

//

import {
  Select,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

//
interface Props {
  onChange: (...even: any[]) => void;
  defaultValue?: string;
  value: string;
}

const UpdateAccountStatus = ({}: Props) => {
  return (
    <Select>
      <SelectLabel>Select Access</SelectLabel>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {["Suspend", "Remove", "Disbled", "Do nothing"].map((item, i) => (
          <SelectItem value={i.toString()}>{item}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UpdateAccountStatus;
