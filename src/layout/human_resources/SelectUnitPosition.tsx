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

import SalaryGradeSelect from "./SalaryGradeSelect";
import { AddExistPositionProgress } from "@/utils/element";
//interface/props/schema
import type { Position, AddExistingPositionProps } from "@/interface/data";
import { AddExistingPosition } from "@/interface/zod";
import {
  Search,
  X,
  Save,
  ListX,
  ListPlus,
  Briefcase,
  Hash,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      const isValid = await trigger();
      if (!isValid) {
        toast.error("Validation Error", {
          description: "Please fix all errors before continuing",
        });
        return;
      }
    }
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
        },
      );
      if (response.status !== 200) {
        throw new Error(response.data.message);
      }

      toast.success("Position added successfully");
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
    // Step 0: Search and Select Position
    <div key="step0" className="space-y-4">
      <InputGroup className="bg-white shadow-sm">
        <InputGroupAddon>
          <Search className="h-4 w-4 text-gray-400" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search position or designation..."
          onChange={(e) => setText(e.target.value)}
          className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </InputGroup>

      <Card className="border shadow-sm overflow-hidden">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0">
              <TableHead className="w-16 text-gray-700">No.</TableHead>
              <TableHead className="text-gray-700">Position Details</TableHead>
            </TableHeader>
            <TableBody>
              {isFetching || isFetchingNextPage ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-32">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading positions...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data ? (
                data.pages.flatMap((item) => item.list).length > 0 ? (
                  data.pages
                    .flatMap((item) => item.list)
                    .map((item, i) => (
                      <SelectPosItem
                        key={item.id}
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
                    <TableCell colSpan={2} className="h-32">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Briefcase className="h-8 w-8 mb-2 text-gray-300" />
                        <p>No positions found</p>
                        <p className="text-sm">Try a different search term</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ) : (
                <SWWItem colSpan={2} />
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setOnOpen(0)}
          className="border-gray-200"
        >
          Close
        </Button>
      </div>
    </div>,

    // Step 1: Configure Position Details
    <div key="step1" className="space-y-4">
      {selected ? (
        <>
          <Card className="border bg-blue-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Selected Position
                  </p>
                  <p className="text-lg font-semibold text-gray-800">
                    {selected.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <div className="space-y-4">
              {/* Designation */}
              <FormField
                control={control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      Designation (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., J.O - Data Encoder"
                        {...field}
                        className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormDescription>
                      For positions with specific designations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Plantilla Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <FormField
                  control={control}
                  name="plantilla"
                  render={({ field }) => (
                    <FormItem className="flex items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(e) => field.onChange(e)}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium cursor-pointer">
                          Plantilla Position
                        </FormLabel>
                        <p className="text-xs text-gray-500">
                          For regular/plantilla positions
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {plantillaStatus && (
                  <FormField
                    control={control}
                    name="itemNumber"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-gray-400" />
                          Item Number/ID
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., ITEM-2024-001"
                            {...field}
                            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <Separator />

              {/* Slots Configuration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    Slot Configuration
                  </FormLabel>
                  <Badge variant="outline" className="px-3">
                    {slots.fields.length}{" "}
                    {slots.fields.length === 1 ? "Slot" : "Slots"}
                  </Badge>
                </div>

                <ScrollArea className="max-h-[300px] overflow-auto pr-3">
                  {slots.fields.length > 0 ? (
                    <div className="space-y-3">
                      {slots.fields.map((_, i) => (
                        <Card key={i} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="px-3">
                                  Slot #{i + 1}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <FormField
                                  control={control}
                                  name={`slot.${i}.occupied`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-start space-x-3 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={(e) =>
                                            field.onChange(e)
                                          }
                                          className="mt-0.5"
                                        />
                                      </FormControl>
                                      <div className="space-y-1">
                                        <FormLabel className="text-sm font-medium cursor-pointer">
                                          Occupied
                                        </FormLabel>
                                        <p className="text-xs text-gray-500">
                                          Slot is currently filled
                                        </p>
                                      </div>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={control}
                                  name={`slot.${i}.salaryGrade`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-sm">
                                        Salary Grade
                                      </FormLabel>
                                      <FormControl>
                                        <SalaryGradeSelect
                                          lineId={lineId}
                                          token={token}
                                          onChange={field.onChange}
                                          value={field.value}
                                        />
                                      </FormControl>
                                      <FormMessage className="text-xs" />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="flex justify-end">
                                <Button
                                  type="button"
                                  onClick={() => handleRemoveSlot(i)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Remove Slot
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-700">
                        At least one slot is required. Add a slot to continue.
                      </AlertDescription>
                    </Alert>
                  )}
                </ScrollArea>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddSlot}
                    variant="outline"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <ListPlus className="h-4 w-4 mr-1" />
                    Add Slot
                  </Button>
                  <Button
                    type="button"
                    disabled={slots.fields.length === 0}
                    size="sm"
                    onClick={handleResetSlots}
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <ListX className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Navigation Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handlePrev}
                  className="border-gray-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleNextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </Form>
        </>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-orange-700">Invalid selected item</p>
            <p className="text-sm text-orange-600 mt-1">
              Please go back and select a position
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handlePrev}
              className="mt-4"
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      )}
    </div>,

    // Step 2: Review and Confirm
    <div key="step2" className="space-y-4">
      {selected ? (
        <>
          <Card className="border border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Review Details</p>
                  <p className="text-sm text-green-600">
                    Please confirm the position details before saving
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 py-1 border-b">
                  <span className="text-sm font-medium text-gray-500">
                    Position:
                  </span>
                  <span className="text-sm font-semibold text-gray-800 col-span-2">
                    {selected.name}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 border-b">
                  <span className="text-sm font-medium text-gray-500">
                    Designation:
                  </span>
                  <span className="text-sm text-gray-800 col-span-2">
                    {designation || (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 border-b">
                  <span className="text-sm font-medium text-gray-500">
                    Item Number:
                  </span>
                  <span className="text-sm font-mono text-gray-800 col-span-2">
                    {itemNumber || (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1 border-b">
                  <span className="text-sm font-medium text-gray-500">
                    Plantilla:
                  </span>
                  <span className="text-sm col-span-2">
                    <Badge
                      variant={plantilla ? "default" : "secondary"}
                      className="px-3"
                    >
                      {plantilla ? "YES" : "NO"}
                    </Badge>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-1">
                  <span className="text-sm font-medium text-gray-500">
                    Slots:
                  </span>
                  <span className="text-sm col-span-2">
                    <Badge variant="outline" className="px-3">
                      {slots.fields.length}{" "}
                      {slots.fields.length === 1 ? "Slot" : "Slots"} Configured
                    </Badge>
                  </span>
                </div>

                {slots.fields.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slot Details
                    </p>
                    {slots.fields.map((slot, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 rounded-lg p-2 text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Slot #{index + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {slot.occupied ? "Occupied" : "Vacant"}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Salary Grade: {slot.salaryGrade || "Not set"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handlePrev}
              className="border-gray-200"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Position
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <div></div>
      )}
    </div>,
  ];

  return (
    <div className="w-full h-full bg-white rounded-lg">
      {/* Progress Header */}
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <AddExistPositionProgress index={step} />
        <p className="text-xs text-gray-500 mt-2 text-center">
          Step {step + 1} of 3:{" "}
          {step === 0
            ? "Select Position"
            : step === 1
              ? "Configure Details"
              : "Review & Confirm"}
        </p>
      </div>

      {/* Content Area */}
      <div className="p-4">{steps[step]}</div>
    </div>
  );
};

export default SelectUnitPosition;
