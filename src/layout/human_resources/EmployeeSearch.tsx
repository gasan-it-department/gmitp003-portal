import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useDebouncedCallback } from "use-debounce";
//
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import UnitSelection from "../medicine/item/UnitSelection";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
//icons
import { ListFilterPlus, Printer } from "lucide-react";

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
  handleChangeParams: (key: string, value: string) => void;
}

const EmployeeSearch = ({
  office,
  // page,
  // year,
  // sgFrom,
  // sgTo,
  // query,
  handleChangeParams,
}: Props) => {
  const [onOpen, setOnOpen] = useState(false);

  const nav = useNavigate();
  const form = useForm<EmployeeFilterProps>({
    resolver: zodResolver(EmployeeFilterSchema),
    defaultValues: {
      sgFrom: "0",
      sgTo: "0",
      level: "",
    },
  });

  const debounce = useDebouncedCallback((value: string) => {
    handleChangeParams("query", value);
  }, 1000);

  const handleSearch = (value: string) => {
    debounce(value);
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 bg-white border-b">
      {/* Search Input */}
      <div className="flex-1">
        <div className="space-y-1.5">
          <label
            htmlFor="searchId"
            className="text-sm font-medium text-gray-700"
          >
            Search
          </label>
          <Input
            onChange={(e) => handleSearch(e.target.value)}
            id="searchId"
            placeholder="Search Employee"
            className="h-9"
          />
        </div>
      </div>

      {/* Office Selection */}
      <div className="min-w-[180px]">
        <div className="space-y-1.5">
          <label htmlFor="office" className="text-sm font-medium text-gray-700">
            Offices
          </label>
          <UnitSelection
            onChange={(e) => handleChangeParams("office", e)}
            value={office}
            defaultValue={office}
          />
        </div>
      </div>

      {/* Year Input */}
      <div className="min-w-[120px]">
        <div className="space-y-1.5">
          <label htmlFor="Year" className="text-sm font-medium text-gray-700">
            Year
          </label>
          <Input defaultValue={currentYear.toString()} className="h-9" />
        </div>
      </div>

      {/* Filter Button */}
      <div className="min-w-[60px]">
        <div className="space-y-1.5">
          <label htmlFor="filter" className="text-sm font-medium text-gray-700">
            Filter
          </label>
          <Button
            onClick={() => setOnOpen(true)}
            id="filter"
            size="sm"
            variant="outline"
            className="h-9 w-full border-gray-300"
          >
            <ListFilterPlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* New Button */}
      <div className="min-w-[60px]">
        <div className="space-y-1.5">
          <label htmlFor="new" className="text-sm font-medium text-gray-700">
            New
          </label>
          <Button
            onClick={() => nav("add")}
            id="new"
            size="sm"
            className="h-9 w-full bg-gray-800 hover:bg-gray-900"
          >
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Modal */}
      <Modal
        title="Advanced Filters"
        children={
          <div className="space-y-4">
            <Form {...form}>
              {/* Salary Grade Section */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-blue-50 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      SG
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">
                    Salary Grade Range
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    name="sgFrom"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-600">
                          From
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            type="number"
                            className="h-8 text-sm"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="sgTo"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-600">
                          To
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            type="number"
                            className="h-8 text-sm"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Appointment Dates Section */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 bg-blue-50 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      AP
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900">
                    Appointment Dates
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    name="dateOrigAppoint"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-600">
                          Original
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            type="date"
                            className="h-8 text-sm"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="dateLastPromotion"
                    render={({ field: { value, onChange, onBlur } }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-600">
                          Last Promotion
                        </FormLabel>
                        <FormControl>
                          <Input
                            value={value}
                            onChange={onChange}
                            onBlur={onBlur}
                            type="date"
                            className="h-8 text-sm"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Form>
          </div>
        }
        onOpen={onOpen}
        className="max-w-md"
        footer={true}
        setOnOpen={() => setOnOpen(false)}
      />
    </div>
  );
};

export default EmployeeSearch;
