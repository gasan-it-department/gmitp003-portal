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
  FormMessage,
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

import { Save, Briefcase, Hash, Users, Lock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
    <div className="w-full max-w-3xl mx-auto p-1 md:p-6">
      <Card className="border shadow-sm">
        <CardHeader className="bg-gray-50 border-b px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl">
                Add New Position
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Create a new position with customizable slots and settings
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 md:p-6">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Options Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  Position Options
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={control}
                    name="exclusive"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            Exclusive for Current Unit
                          </FormLabel>
                          <p className="text-xs text-gray-500">
                            Position will only be available in this unit
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="plantilla"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            Plantilla Position
                          </FormLabel>
                          <p className="text-xs text-gray-500">
                            Requires item number/ID
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Plantilla Item Number */}
              {plantilla && (
                <FormField
                  control={control}
                  name="itemNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        Item Number/ID
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., ITEM-2024-001"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Unique identifier for plantilla position
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Title and Designation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={control}
                  rules={{ required: true }}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        Position Title <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Senior Developer"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  rules={{ required: true }}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        Designation (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Team Lead"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Level and Slot Count */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  rules={{ required: true }}
                  name="level"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        Level <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["Key Personnel", "Administrative", "Technical"].map(
                            (item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="slotCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        Number of Slots <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          placeholder="e.g., 3"
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Total available positions for this role
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Slots Configuration */}
              {slots?.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">
                      Slot Configuration
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {slots.length} {slots.length === 1 ? "Slot" : "Slots"}{" "}
                      Total
                    </Badge>
                  </div>

                  {slots?.map((_, index) => (
                    <Card
                      key={index}
                      className="border border-gray-200 bg-gray-50/50"
                    >
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="px-3">
                              Slot #{index + 1}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={control}
                              name={`slot.${index}.status`}
                              render={({ field }) => (
                                <FormItem className="flex items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="mt-0.5"
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-medium cursor-pointer">
                                      Occupied?
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
                              name={`slot.${index}.salaryGrade`}
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Position
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddPosition;
