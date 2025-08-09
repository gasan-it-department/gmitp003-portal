import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams, useNavigate } from "react-router";
import { useDebouncedCallback } from "use-debounce";
//
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
//mock

import { offices } from "@/data/mock";
import { ListFilterPlus, UserRoundPlus } from "lucide-react";

//props and interfaces
import { EmployeeFilterSchema } from "@/interface/zod";
import type { EmployeeFilterProps } from "@/interface/data";

interface Props {
  office: string;
  page: string;
  year: string;
  sgFrom: string;
  sgTo: string;
  query: string;
}
const EmployeeSearch = ({ office, page, year, sgFrom, sgTo, query }: Props) => {
  const [onOpen, setOnOpen] = useState(false);

  const [params, setParams] = useSearchParams({
    page: "1",
    office: "all",
    year: "all",
    sgFrom: "",
    sgTo: "",
    query: "",
  });
  const nav = useNavigate();
  const form = useForm<EmployeeFilterProps>({
    resolver: zodResolver(EmployeeFilterSchema),
    defaultValues: {
      sgFrom: "0",
      sgTo: "0",
      level: "",
    },
  });

  const currentPage = params.get("page") || "1";
  const currentOffice = params.get("office") || "all";
  const currentYear = params.get("year") || "all";
  const currentSgFrom = params.get("sgFrom") || "";
  const currentSgTo = params.get("sgTo") || "";
  const currentQuery = params.get("query") || "";

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      }
    );
  };

  const debounce = useDebouncedCallback((value: string) => {
    handleChangeParams("query", value);
  }, 1000);

  const handleSearch = (value: string) => {
    debounce(value);
  };
  return (
    <div className=" w-full h-full flex items-center gap-1 px-4 bg-white">
      <div className=" p-1 w-full ">
        <label htmlFor="searchId" className=" font-medium text-sm">
          Search
        </label>
        <Input
          onChange={(e) => handleSearch(e.target.value)}
          id="searchId"
          placeholder="Search Employee"
        />
      </div>

      <div>
        <label htmlFor="office" className=" font-medium text-sm">
          Offices
        </label>
        <Select defaultValue="all">
          <SelectTrigger id="office">
            <SelectValue className=" max-w-32" placeholder="Office/Depart." />
          </SelectTrigger>
          <SelectContent className=" max-h-[400px]">
            <SelectItem value="all">All</SelectItem>
            {offices.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="Year" className=" font-medium text-sm">
          Year
        </label>
        <Select defaultValue="all">
          <SelectTrigger id="Year">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
            <SelectItem value="2022">2022</SelectItem>
            <SelectItem value="2021">2021</SelectItem>
            <SelectItem value="2020">2020</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="filter" className=" font-medium text-sm">
          Filter
        </label>
        <Button onClick={() => setOnOpen(true)} id="filter">
          <ListFilterPlus />
        </Button>
      </div>
      <div>
        <label htmlFor="filter" className=" font-medium text-sm">
          New
        </label>
        <Button onClick={() => nav("add")} id="filter">
          <UserRoundPlus />
        </Button>
      </div>
      <Modal
        title={"TEst"}
        children={
          <div>
            <Form {...form}>
              <div className=" w-full grid grid-rows-2 grid-cols-2 border gap-1">
                <label
                  htmlFor="sgFrom"
                  className=" row-start-1 col-start-1 col-span-2"
                >
                  Salary Grade
                </label>
                <FormField
                  name="sgFrom"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormItem id="sgFrom" className=" row-start-2 col-start-1">
                      <FormLabel>SG from</FormLabel>
                      <FormControl>
                        <Input
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          type="number"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="sgTo"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormItem className=" row-start-2 col-start-2">
                      <FormLabel>SG to</FormLabel>
                      <FormControl>
                        <Input
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          type="number"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className=" w-full grid grid-rows-2 grid-cols-2 border gap-1">
                <label
                  htmlFor="sgFrom"
                  className=" row-start-1 col-start-1 col-span-2"
                >
                  Appoinment and Promotion
                </label>
                <FormField
                  name="sgFrom"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormItem
                      id="dateOrigAppoint"
                      className=" row-start-2 col-start-1"
                    >
                      <FormLabel>SG from</FormLabel>
                      <FormControl>
                        <Input
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          type="date"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="dateLastPromotion"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormItem className=" row-start-2 col-start-2">
                      <FormLabel>SG to</FormLabel>
                      <FormControl>
                        <Input
                          value={value}
                          onChange={onChange}
                          onBlur={onBlur}
                          type="date"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </Form>
          </div>
        }
        onOpen={onOpen}
        className={""}
        footer={true}
        setOnOpen={() => setOnOpen(false)}
      />
    </div>
  );
};

export default EmployeeSearch;
