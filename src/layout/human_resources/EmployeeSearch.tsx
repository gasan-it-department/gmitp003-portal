import { useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { useDebouncedCallback } from "use-debounce";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import { ListFilterPlus, Search, UserPlus, Users, X } from "lucide-react";

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
  query,
  handleChangeParams,
}: Props) => {
  const [onOpen, setOnOpen] = useState(false);
  const nav = useNavigate();

  const form = useForm<EmployeeFilterProps>({
    resolver: zodResolver(EmployeeFilterSchema),
    defaultValues: { sgFrom: "0", sgTo: "0", level: "" },
  });

  const debounce = useDebouncedCallback((value: string) => {
    handleChangeParams("query", value);
  }, 700);

  const {
    fields: tagFields,
    append: appendTag,
    remove: removeTag,
  } = useFieldArray({ control: form.control, name: "tags" });

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

  // Count active filters for the indicator badge
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (office !== "all") n++;
    if (tagFields.length > 0) n++;
    return n;
  }, [office, tagFields.length]);

  return (
    <div className="px-3 py-2 bg-white border-b flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Users className="h-3 w-3 text-blue-500" />
        <h3 className="text-xs font-semibold text-gray-800">Employees</h3>
      </div>

      <div className="flex-1 min-w-[200px]">
        <InputGroup className="bg-white">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name, username, or email..."
            defaultValue={query}
            onChange={(e) => debounce(e.target.value)}
            className="h-8 text-xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                handleChangeParams("query", "");
                debounce.cancel();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </InputGroup>
      </div>

      <div className="w-44">
        <UnitSelection
          onChange={(e) => handleChangeParams("office", e)}
          value={office}
          defaultValue={office}
        />
      </div>

      <Button
        onClick={() => setOnOpen(true)}
        size="sm"
        variant="outline"
        className="h-8 text-xs gap-1.5 relative"
      >
        <ListFilterPlus className="h-3 w-3" />
        Filters
        {activeFilterCount > 0 && (
          <Badge
            variant="default"
            className="h-4 min-w-4 px-1 text-[9px] rounded-full"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      <Button
        onClick={() => nav("add")}
        size="sm"
        className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
      >
        <UserPlus className="h-3 w-3" />
        Add Employee
      </Button>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <ListFilterPlus className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="text-sm font-semibold">Advanced Filters</span>
          </div>
        }
        children={
          <div className="p-1">
            <Form {...form}>
              <FormField
                name="tags"
                control={form.control}
                render={() => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700">
                      Tags
                    </FormLabel>
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
          </div>
        }
        onOpen={onOpen}
        className="min-w-5xl max-h-[95vh] overflow-auto"
        footer={true}
        setOnOpen={() => setOnOpen(false)}
      />
    </div>
  );
};

export default EmployeeSearch;
