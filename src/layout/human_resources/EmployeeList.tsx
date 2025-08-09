import React from "react";

//libs & hooks
import { useQuery } from "@tanstack/react-query";
//
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from "@/components/ui/table";

//statements
import { getEmployees } from "@/db/statement";

//
interface Props {
  office: string;
  page: string;
  year: string;
  sgFrom: string;
  sgTo: string;
  query: string;
}
const EmployeeList = ({ office, page, year, sgFrom, sgTo, query }: Props) => {
  // const { data, isFetching } = useQuery({
  //   queryKey: ["employees"],
  //   queryFn: () => getEmployees(),
  // });
  const date = new Date().toISOString();
  console.log(date);
  return (
    <Table className=" w-full h-full">
      <TableHeader>
        <TableHead>Lastname</TableHead>
        <TableHead>Firstname</TableHead>
        <TableHead>Middle name</TableHead>
        <TableHead>Date of Birth</TableHead>
        <TableHead>Date of Orig. Appointment</TableHead>
        <TableHead>Date of Last Promotion</TableHead>
        <TableHead>Position</TableHead>
        <TableHead>Item Number</TableHead>
        <TableHead>SG</TableHead>
        <TableHead>Lastname</TableHead>
        <TableHead>Lastname</TableHead>
        <TableHead>Lastname</TableHead>
        <TableHead>Status</TableHead>
      </TableHeader>
      <TableBody></TableBody>
    </Table>
  );
};

export default EmployeeList;
