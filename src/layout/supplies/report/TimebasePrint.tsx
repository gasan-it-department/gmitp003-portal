import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
//
import { PrintTimebaseReport } from "@/interface/zod";
import type { TimebasedPrintProps } from "@/interface/data";

interface Props {
  setOpen: React.Dispatch<React.SetStateAction<number>>;
  id: string | undefined;
  lineId: string;
  token: string;
}

const TimebasePrint = ({ setOpen, id, lineId, token }: Props) => {
  const currentYear = new Date().getFullYear();

  const form = useForm<TimebasedPrintProps>({
    resolver: zodResolver(PrintTimebaseReport),
    defaultValues: {
      years: [currentYear.toString()],
      period: ["1"], // This is now an array
    },
  });

  const { control, watch, setValue, handleSubmit } = form;

  const years = watch("years") || [];
  const periods = watch("period") || []; // Changed from period to periods (array)

  const handleYearCheck = (yearValue: number, checked: boolean) => {
    const yearString = yearValue.toString();
    const currentYears = [...years];

    if (checked) {
      if (!currentYears.includes(yearString)) {
        currentYears.push(yearString);
      }
    } else {
      const index = currentYears.indexOf(yearString);
      if (index > -1) {
        currentYears.splice(index, 1);
      }
    }

    setValue("years", currentYears);
  };

  const handlePeriodCheck = (periodNumber: "1" | "2", checked: boolean) => {
    const currentPeriods = [...periods]; // Use the array directly

    if (checked) {
      if (!currentPeriods.includes(periodNumber)) {
        currentPeriods.push(periodNumber);
      }
    } else {
      const index = currentPeriods.indexOf(periodNumber);
      if (index > -1) {
        currentPeriods.splice(index, 1);
      }
    }

    setValue("period", currentPeriods); // Set as array
  };

  const isYearChecked = (yearValue: number) => {
    return years.includes(yearValue.toString());
  };

  const isPeriodChecked = (periodNumber: "1" | "2") => {
    return periods.includes(periodNumber); // Direct array check
  };

  const onSubmit = async (data: TimebasedPrintProps) => {
    try {
      const response = await axios.get("/supply/excel", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        responseType: "blob",
        params: {
          id,
          yearRange: data.years,
          lineId: lineId,
          category: true,
          period: data.period, // This is now an array
        },
      });

      if (response.status !== 200) {
        return toast.error("FAILED TO SUBMIT", {
          description: "Try again",
        });
      }

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${new Date().toISOString()}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "");
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started!", {
        description: "Your Excel file is being downloaded.",
      });
      return;
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download Failed", {
        description: "Failed to download the file. Please try again.",
      });
    } finally {
      return;
    }
  };

  return (
    <div>
      <Form {...form}>
        <div className="w-full flex gap-2 justify-center items-center">
          <FormField
            control={control}
            name="years"
            render={() => (
              <FormItem>
                <FormLabel>Years</FormLabel>
                <FormControl>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const yearValue = currentYear - i;
                      const checked = isYearChecked(yearValue);

                      return (
                        <div
                          key={yearValue}
                          className="flex gap-2 items-center border border-gray-200 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleYearCheck(yearValue, !checked)}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(checked) =>
                              handleYearCheck(yearValue, checked as boolean)
                            }
                          />
                          <Label className="cursor-pointer">{yearValue}</Label>
                        </div>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4">
          <FormLabel>Period</FormLabel>
          <div className="flex gap-2 mt-2">
            <div
              className="flex gap-2 items-center border border-gray-200 p-2 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => handlePeriodCheck("1", !isPeriodChecked("1"))}
            >
              <Checkbox
                checked={isPeriodChecked("1")}
                onCheckedChange={(checked) =>
                  handlePeriodCheck("1", checked as boolean)
                }
              />
              <Label className="cursor-pointer">1st half</Label>
            </div>
            <div
              className="flex gap-2 items-center border border-gray-200 p-2 rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => handlePeriodCheck("2", !isPeriodChecked("2"))}
            >
              <Checkbox
                checked={isPeriodChecked("2")}
                onCheckedChange={(checked) =>
                  handlePeriodCheck("2", checked as boolean)
                }
              />
              <Label className="cursor-pointer">2nd half</Label>
            </div>
          </div>
          <FormMessage />
        </div>
      </Form>

      <div className="w-full py-2 flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={() => setOpen(0)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit(onSubmit)}>
          Go
        </Button>
      </div>
    </div>
  );
};

export default TimebasePrint;
