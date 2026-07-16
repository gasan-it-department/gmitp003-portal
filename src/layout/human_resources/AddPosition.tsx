import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import axios from "@/db/axios";

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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import SalaryGradeSelect from "./SalaryGradeSelect";

import {
  Save,
  Briefcase,
  Hash,
  Users,
  Lock,
  FileText,
  Loader2,
} from "lucide-react";

import { AddPositionSchema } from "@/interface/zod";
import type { AddPositionProps } from "@/interface/data";

interface Props {
  existed: boolean;
  unitId: string;
  lineId: string;
  token: string;
  userId: string;
}

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const AddPosition = ({ unitId, lineId, token, userId }: Props) => {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<AddPositionProps>({
    resolver: zodResolver(AddPositionSchema),
    defaultValues: {
      title: "",
      designation: "",
      plantilla: false,
      itemNumber: "",
      slotCount: "1",
      level: "",
      slot: [{ status: false, salaryGrade: "" }],
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

  // Resize the slot array when the user changes slotCount.
  useEffect(() => {
    const desired = Math.max(1, parseInt(slotCount, 10) || 1);
    const current = slots ?? [];
    if (current.length === desired) return;
    if (current.length < desired) {
      const next = [...current];
      while (next.length < desired) {
        next.push({ status: false, salaryGrade: "" });
      }
      setValue("slot", next);
    } else {
      setValue("slot", current.slice(0, desired));
    }
  }, [slotCount, slots, setValue]);

  const createMut = useMutation({
    mutationFn: async (data: AddPositionProps) => {
      const res = await axios.post(
        "/add-position",
        {
          title: data.title,
          plantilla: data.plantilla,
          itemNumber: data.itemNumber || undefined,
          slotCount: data.slotCount,
          level: data.level,
          slot: data.slot,
          unitId,
          designation: data.designation || undefined,
          lineId,
          userId,
          exclusive: data.exclusive,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token ?? token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return res.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["postions", unitId] });
      toast.success("Position added");
      form.reset();
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to add position")),
  });

  return (
    <div className="w-full max-h-[85vh] overflow-auto">
      <div className="p-3 space-y-3">

        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-900">
              Add New Position
            </h3>
            <p className="text-[10px] text-gray-500 leading-none mt-0.5">
              Create a position with one or more configurable slots
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={handleSubmit((d) => {
              // A slot's salary grade defaults empty — block submit until each
              // is chosen, so we never send a placeholder into the FK.
              if (d.slot.some((s) => !s.salaryGrade)) {
                toast.error("Choose a salary grade for every slot.");
                return;
              }
              return createMut.mutateAsync(d);
            })}
            className="space-y-3"
          >
            {/* Options */}
            <div className="border rounded-md bg-gray-50 p-2.5 space-y-2">
              <h4 className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" />
                Position Options
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <FormField
                  control={control}
                  name="exclusive"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="leading-tight">
                        <FormLabel className="text-[11px] font-medium cursor-pointer">
                          Exclusive to this unit
                        </FormLabel>
                        <p className="text-[10px] text-gray-500">
                          Cannot be assigned to other units
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="plantilla"
                  render={({ field }) => (
                    <FormItem className="flex items-start gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="leading-tight">
                        <FormLabel className="text-[11px] font-medium cursor-pointer">
                          Plantilla Position
                        </FormLabel>
                        <p className="text-[10px] text-gray-500">
                          Requires an item number / ID
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Plantilla item number */}
            {plantilla && (
              <FormField
                control={control}
                name="itemNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <Hash className="h-2.5 w-2.5" />
                      Item Number / ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., ITEM-2024-001"
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Unique identifier for the plantilla position.
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            )}

            {/* Title + Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormField
                control={control}
                name="title"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <Briefcase className="h-2.5 w-2.5" />
                      Title *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Senior Administrative Officer"
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <FileText className="h-2.5 w-2.5" />
                      Designation
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Team Lead"
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Optional role designation.
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Level + Slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FormField
                control={control}
                name="level"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      Level *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
                          "Key Personnel",
                          "Administrative",
                          "Technical",
                        ].map((opt) => (
                          <SelectItem
                            key={opt}
                            value={opt}
                            className="text-xs"
                          >
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="slotCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <Users className="h-2.5 w-2.5" />
                      Number of Slots *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Total positions available for this role.
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Slots */}
            {slots?.length > 0 && (
              <div className="border rounded-md bg-white overflow-hidden">
                <div className="px-2.5 py-1.5 border-b bg-gray-50 flex items-center justify-between gap-2">
                  <h4 className="text-[10px] font-semibold text-gray-700">
                    Slot Configuration
                  </h4>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {slots.length} slot{slots.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="p-2 space-y-2">
                  {slots.map((_, index) => (
                    <div
                      key={index}
                      className="border rounded bg-gray-50/40 p-2 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Slot #{index + 1}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <FormField
                          control={control}
                          name={`slot.${index}.status`}
                          render={({ field }) => (
                            <FormItem className="flex items-start gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-0.5"
                                />
                              </FormControl>
                              <div className="leading-tight">
                                <FormLabel className="text-[11px] font-medium cursor-pointer">
                                  Occupied?
                                </FormLabel>
                                <p className="text-[10px] text-gray-500">
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
                              <FormLabel className="text-[10px] font-semibold text-gray-700">
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
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-1.5 pt-2 border-t">
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || createMut.isPending}
                className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700 min-w-[120px]"
              >
                {isSubmitting || createMut.isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3" />
                    Save Position
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default AddPosition;
