import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useDebouncedCallback } from "use-debounce";
//
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import ApplicantTagsSelect from "../FormTags";
//icons
import { ListFilterPlus, Printer, Search } from "lucide-react";

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

  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag,
  } = useFieldArray({
    control: form.control,
    name: "tags",
  });

  const handleCheckTags = (tag: string) => {
    const check = tagFields.findIndex((item) => item.tag === tag);
    return { res: check !== -1, index: check };
  };

  const handleAddTag = (tag: string, cont: string) => {
    const check = handleCheckTags(tag);
    if (check.res) {
      removeTag(check.index);
      return;
    }
    appendTag({ tag, cont });
  };

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
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search employee"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>
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
          <Form {...form}>
            <FormField
              name="tags"
              control={form.control}
              render={() => (
                <FormItem>
                  <FormLabel className="text-xs text-gray-600">Tags</FormLabel>
                  <FormControl>
                    <ApplicantTagsSelect
                      handleAddTags={handleAddTag}
                      handleCheckTags={handleCheckTags}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        }
        onOpen={onOpen}
        className=" min-w-5xl max-h-[95vh] overflow-auto"
        footer={true}
        setOnOpen={() => setOnOpen(false)}
      />
    </div>
  );
};

export default EmployeeSearch;
