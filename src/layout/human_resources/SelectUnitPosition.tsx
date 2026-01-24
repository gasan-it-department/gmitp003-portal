import { useState, useEffect } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useForm, useFieldArray } from "react-hook-form";
import axios from "@/db/axios";
import { isAxiosError } from "axios";
//
import { linePositions } from "@/db/statement";

//components/layout
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import SWWItem from "../item/SWWItem";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import SelectPosItem from "./item/SelectPosItem";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Item,
  ItemHeader,
  ItemContent,
  ItemFooter,
  ItemTitle,
  ItemActions,
} from "@/components/ui/item";
import SalaryGradeSelect from "./SalaryGradeSelect";
import { AddExistPositionProgress } from "@/utils/element";
//interface/props/schema
import type { Position, AddExistingPositionProps } from "@/interface/data";
import { AddExistingPosition } from "@/interface/zod";
import { Search, X, Save, ListX, ListPlus } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
interface Props {
  token: string;
  lineId: string;
  officeId: string;
  setOnOpen: React.Dispatch<React.SetStateAction<number>>;
  userid: string;
}

interface ListProps {
  list: Position[];
  lastCursor: string | null;
  hasMore: boolean;
}
const SelectUnitPosition = ({
  token,
  lineId,
  setOnOpen,
  officeId,
  userid,
}: Props) => {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");

  const [selected, setSelected] = useState<Position | undefined>(undefined);
  const [query] = useDebounce(text, 1000);
  const { data, isFetching, isFetchingNextPage, refetch } =
    useInfiniteQuery<ListProps>({
      queryKey: ["line-position", lineId],
      queryFn: ({ pageParam }) =>
        linePositions(token, lineId, pageParam as string | null, "20", query),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
    });

  const queryClient = useQueryClient();

  const form = useForm<AddExistingPositionProps>({
    resolver: zodResolver(AddExistingPosition),
    defaultValues: {
      itemNumber: "",
      slot: [],
      plantilla: false,
      designation: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    setValue,
    trigger,
    getValues,
    watch,
  } = form;

  const designation = getValues("designation");
  const itemNumber = getValues("itemNumber");
  const plantilla = getValues("plantilla");
  const plantillaStatus = watch("plantilla");

  const slots = useFieldArray({
    control,
    name: "slot",
  });

  const handleAddSlot = () => {
    slots.append({
      salaryGrade: "",
      occupied: false,
    });
  };

  const handleRemoveSlot = (index: number) => {
    slots.remove(index);
  };

  const handleResetSlots = () => {
    setValue("slot", []);
  };

  const handleNextStep = async () => {
    if (step === 2) return;
    if (step === 1) {
      // Validate all form fields including slots
      const isValid = await trigger();
      if (!isValid) {
        toast.error("Validation Error", {
          description: "Please fix all errors before continuing",
        });
        return;
      }
    }
    // Additional validation for slots
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (step === 0) return;
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data: AddExistingPositionProps) => {
    if (!selected) {
      return toast.warning("Invalid selected item");
    }
    try {
      const response = await axios.post(
        "/position/unit/position",
        {
          lineId,
          unitId: officeId,
          slot: data.slot.map((item) => ({
            status: item.occupied,
            salaryGrade: item.salaryGrade,
          })),
          plantilla: data.plantilla,
          title: selected.name,
          userId: userid,
          id: selected.id,
          itemNumber: data.itemNumber || "N/A",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );
      if (response.status !== 200) {
        throw new Error(response.data.message);
      }

      toast.success("Saved");
      setOnOpen(0);
      await queryClient.invalidateQueries({
        queryKey: ["postions", officeId],
        refetchType: "active",
      });
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to submit";

        toast.error("Failed to submit", {
          description: errorMessage,
        });
      } else if (error instanceof Error) {
        toast.error("Failed to submit", {
          description: error.message,
        });
      } else {
        toast.error("Failed to submit", {
          description: "An unexpected error occurred",
        });
      }
    }
  };

  useEffect(() => {
    if (isSubmitting) {
      setOnOpen(2);
    }
  }, [isSubmitting]);

  useEffect(() => {
    refetch();
  }, [query]);

  const steps = [
    <>
      <InputGroup className=" bg-white">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search position/designation"
          onChange={(e) => setText(e.target.value)}
        />
      </InputGroup>
      <Table className=" mt-2">
        <TableHeader className=" border bg-neutral-700">
          <TableHead className=" text-white">No.</TableHead>
          <TableHead className=" text-white">Label</TableHead>
        </TableHeader>
        <TableBody>
          {isFetching || isFetchingNextPage ? (
            <TableRow>
              <TableCell colSpan={3} className=" text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : data ? (
            data.pages.flatMap((item) => item.list).length > 0 ? (
              data.pages
                .flatMap((item) => item.list)
                .map((item, i) => (
                  <SelectPosItem
                    item={item}
                    no={i}
                    onChange={() => {}}
                    query={query}
                    onClick={() => {
                      setSelected(item);
                      handleNextStep();
                    }}
                  />
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className=" text-center">
                  No data found!
                </TableCell>
              </TableRow>
            )
          ) : (
            <SWWItem colSpan={3} />
          )}
        </TableBody>
      </Table>
      <div className=" w-full flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setOnOpen(0)}>
          Close
        </Button>
      </div>
    </>,
    <div className=" w-full">
      {selected ? (
        <div className=" w-full">
          <p className=" font-medium mb-2">Position: {selected.name}</p>
          <Form {...form}>
            <FormField
              control={control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Designation (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter disignation" {...field} />
                  </FormControl>
                  <FormDescription>
                    For position with designation (e.g. J.O - Data Encoder/IT
                    etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="plantilla"
              render={({ field }) => (
                <FormItem className=" w-full flex mt-4">
                  <FormLabel>Plantilla:</FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(e) => field.onChange(e)}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            {plantillaStatus && (
              <FormField
                control={control}
                name="itemNumber"
                render={({ field }) => (
                  <FormItem className=" mt-4">
                    <FormLabel>Item number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item number" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormDescription>For regular position.</FormDescription>
            <ScrollArea className=" w-full max-h-1/2 overflow-auto mt-2">
              {slots.fields.length > 0 ? (
                slots.fields.map((_, i) => (
                  <Item key={i} variant="outline" className=" bg-white mt-2">
                    <ItemHeader>
                      <ItemTitle>{i + 1}.</ItemTitle>
                    </ItemHeader>
                    <ItemContent>
                      <FormField
                        control={control}
                        name={`slot.${i}.occupied`}
                        render={({ field }) => (
                          <FormItem className=" w-full flex">
                            <FormLabel>Occupied:</FormLabel>
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(e) => field.onChange(e)}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`slot.${i}.salaryGrade`}
                        render={({ field }) => (
                          <FormItem className=" w-full flex">
                            <FormLabel>Salary Grade:</FormLabel>
                            <FormControl>
                              <SalaryGradeSelect
                                lineId={lineId}
                                token={token}
                                onChange={field.onChange}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </ItemContent>
                    <ItemFooter className="">
                      <ItemActions>
                        <Button
                          disabled={isSubmitting}
                          onClick={() => handleRemoveSlot(i)}
                          size="sm"
                          variant="outline"
                        >
                          <X /> Remove
                        </Button>
                      </ItemActions>
                    </ItemFooter>
                  </Item>
                ))
              ) : (
                <div className=" w-full p-2 border border-orange-300 rounded">
                  <p className=" font-medium text-muted-foreground text-sm text-center">
                    At least one slot is requ
                  </p>
                </div>
              )}
            </ScrollArea>
            <div className=" w-full flex gap-2">
              <Button
                disabled={slots.fields.length === 0}
                size="sm"
                onClick={handleResetSlots}
                className=" mt-2 border border-red-300"
                variant="outline"
              >
                <ListX />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleAddSlot}
                className=" mt-2 border border-neutral-400"
                variant="outline"
              >
                <ListPlus />
                Add Slot
              </Button>
            </div>
            <div className=" w-full py-2 flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={handlePrev}>
                Prev
              </Button>
              <Button size="sm" onClick={handleNextStep}>
                Continue
              </Button>
            </div>
          </Form>
        </div>
      ) : (
        <div className=" w-full flex justify-center">
          <p className=" text-muted-foreground">Invalid selected item</p>
        </div>
      )}
    </div>,

    <div className="w-full">
      {selected ? (
        <div className=" w-full flex flex-col gap-2">
          <div className=" w-full grid grid-cols-4 py-3">
            <p className=" col-span-1 text-sm">Position</p>
            <p className=" col-span-3 text-sm font-medium">: {selected.name}</p>
            <p className=" col-span-1 text-sm">Designation</p>
            <p className=" col-span-3 text-sm font-medium">
              : {designation || "N/A"}
            </p>
            <p className=" col-span-1 text-sm">Item ID/Number</p>
            <p className=" col-span-3 text-sm font-medium">
              : {itemNumber || "N/A"}
            </p>

            <p className=" col-span-1 text-sm">Plantilla</p>
            <p className=" col-span-3 text-sm font-medium">
              : {plantilla ? "YES" : "NO"}
            </p>
            <p className=" col-span-1 text-sm">Slot/s</p>
            <p className=" col-span-3 text-sm font-medium">
              : {slots.fields.length}
            </p>
          </div>

          <div className=" w-full py-2 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={handlePrev}>
              Prev
            </Button>
            <Button size="sm" onClick={handleSubmit(onSubmit)}>
              <Save />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>,
  ];
  return (
    <div className=" w-full h-full">
      <div className=" w-full py-2 border border-x-0 border-t-0 mb-2">
        <AddExistPositionProgress index={step} />
      </div>
      {steps[step]}
    </div>
  );
};

export default SelectUnitPosition;
