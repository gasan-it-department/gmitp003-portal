import React from "react";

//
import Office from "@/route/human_resources/Office";
import { offices } from "@/data/mock";
//
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";

interface Props {
  value: string;
  className: string;
}

const Departments = ({ value, className }: Props) => {
  return (
    <Select value={value}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select Office" />
      </SelectTrigger>
      <SelectContent>
        {offices.map((item) => (
          <SelectItem value={item.id}>{item.title}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default Departments;
