import { useForm } from "react-hook-form";
import { useAuth } from "@/provider/ProtectedRoute";
import axios from "@/db/axios";
import { useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import SalaryGradeSelect from "./SalaryGradeSelect";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AddPositionSchema } from "@/interface/zod";
import type { AddPositionProps } from "@/interface/data";

import { Save } from "lucide-react";

interface Props {
  existed: boolean;
  unitId: string;
  lineId: string;
  token: string;
  userId: string;
}

const AddPosition = ({ unitId, lineId, token, userId }: Props) => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const form = useForm<AddPositionProps>({
    resolver: zodResolver(AddPositionSchema),
    defaultValues: {
      title: "",
      plantilla: false,
      itemNumber: "",
      slotCount: "1",
      level: "",
      slot: [],
      exclusive: false,
    },
  });

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
    control,
  } = form;

  const slotCount = watch("slotCount");
  const plantilla = watch("plantilla");
  const slots = watch("slot");

  // Update slot array when slotCount changes
  useEffect(() => {
    const currentCount = parseInt(slotCount, 10) || 1;
    const currentSlots = slots || [];

    if (currentSlots.length < currentCount) {
      // Add new slots with default values
      const newSlots = [...currentSlots];
      while (newSlots.length < currentCount) {
        newSlots.push({ status: true, salaryGrade: "1" });
      }
      setValue("slot", newSlots);
    } else if (currentSlots.length > currentCount) {
      // Remove extra slots
      setValue("slot", currentSlots.slice(0, currentCount));
    }
  }, [slotCount, slots, setValue]);

  const onSubmit = async (data: AddPositionProps) => {
    try {
      const response = await axios.post(
        "/add-position",
        {
          title: data.title,
          plantilla: data.plantilla,
          itemNumber: data.itemNumber,
          slotCount: data.slotCount,
          level: data.level,
          slot: data.slot,
          unitId: unitId,
          designation: data.designation,
          lineId,
          userId,
          exclusive: data.exclusive,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );
      if (response.status === 200) {
        queryClient.invalidateQueries({
          queryKey: ["postions"],
        });
        toast.success("Position added successfully", {
          closeButton: false,
          duration: 3000,
        });
        console.log("Position added successfully");
      }
      if (response.data.error === 1 && response.status === 200) {
        toast.error(response.data.message, {
          closeButton: false,
          duration: 3000,
        });
      }
      return;
    } catch (error) {
      console.error("Error adding position:", error);
      toast.error("Failed to add position", {
        closeButton: false,
        duration: 3000,
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
    // Handle form submission
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Item Number */}
          <FormField
            control={control}
            name="exclusive"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 cursor-pointer">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Exclusive for the Current Unit</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="plantilla"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 cursor-pointer mt-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Plantilla</FormLabel>
              </FormItem>
            )}
          />
          {plantilla && (
            <FormField
              control={control}
              name="itemNumber"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Item Number/ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Type position's Item number here"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          {/* Title */}
          <FormField
            control={control}
            rules={{ required: true }}
            name="title"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Position</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter position" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            rules={{ required: true }}
            name="designation"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Designation (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter position's designation"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            rules={{ required: true }}
            name="level"
            control={control}
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Level</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="max-h-42">
                      {["Key Personnel", "Administrative", "Technical"].map(
                        (item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Slot Count */}
          <FormField
            control={control}
            name="slotCount"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Slot</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    placeholder="Number of slots"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormDescription className="mt-4">
            You can set every slot's status and salary grade here.
          </FormDescription>
          {/* Dynamic Slots */}
          {slots?.map((_, index) => (
            <div
              key={index}
              className="space-y-4 mt-4 border border-gray-400 p-4 rounded bg-white"
            >
              <FormField
                control={control}
                name={`slot.${index}.status`}
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 cursor-pointer">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>Slot {index + 1} Occupied?</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`slot.${index}.salaryGrade`}
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Slot {index + 1} Salary Grade</FormLabel>
                    <FormControl>
                      <SalaryGradeSelect
                        lineId={lineId}
                        token={token}
                        onChange={field.onChange}
                        value={field.value}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}

          <div className="w-full flex justify-end py-2">
            <Button
              type="submit"
              className="rounded"
              size="sm"
              disabled={isSubmitting}
            >
              <Save strokeWidth={1.5} />
              {isSubmitting ? "Processing..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddPosition;
