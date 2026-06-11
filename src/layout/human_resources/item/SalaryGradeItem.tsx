import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
import { toast } from "sonner";

import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormMessage,
  FormDescription,
  FormItem,
  FormField,
  FormLabel,
} from "@/components/ui/form";

import { Users, Landmark, Pencil, ChevronRight } from "lucide-react";

import type { SalaryGrade, UpdateSalaryGradeProps } from "@/interface/data";
import { UpdateSalaryGradeSchema } from "@/interface/zod";

interface Props {
  item: SalaryGrade;
  token: string;
  userId: string;
  lineId: string;
}

const SalaryGradeItem = ({ item, userId, token, lineId }: Props) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const nav = useNavigate();

  const form = useForm<UpdateSalaryGradeProps>({
    resolver: zodResolver(UpdateSalaryGradeSchema),
    defaultValues: { amount: item.amount.toString() },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
  } = form;

  // Re-sync the form whenever the modal opens or the row changes
  useEffect(() => {
    if (open) reset({ amount: item.amount.toString() });
  }, [open, item.amount, reset]);

  const onSubmit = async (data: UpdateSalaryGradeProps) => {
    try {
      const response = await axios.patch(
        "/salary-grade/update",
        {
          id: item.id,
          amount: parseInt(data.amount, 10),
          userId,
          lineId,
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
        throw new Error(response.data?.message ?? "Failed to update");
      }
      await queryClient.invalidateQueries({
        queryKey: ["salary-grade", lineId],
        refetchType: "active",
      });
      toast.success(`Grade ${item.grade} updated`);
      setOpen(false);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        (err instanceof Error ? err.message : "Failed to update");
      toast.error(msg);
    }
  };

  const userCount = item._count?.users ?? 0;

  return (
    <>
      <TableRow
        key={item.id}
        onClick={() => nav(`/${lineId}/human-resources/salary/${item.id}`)}
        className="hover:bg-gray-50 cursor-pointer border-b group"
      >
        <TableCell className="px-3 py-2 text-center">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
            {item.grade}
          </Badge>
        </TableCell>
        <TableCell className="px-3 py-2">
          <p className="text-xs font-semibold text-gray-900">
            ₱{item.amount.toLocaleString("en-PH")}
          </p>
          <p className="text-[10px] text-gray-400">per month</p>
        </TableCell>
        <TableCell className="px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-700">
              {userCount} user{userCount !== 1 ? "s" : ""}
            </span>
          </div>
        </TableCell>
        <TableCell className="px-3 py-2 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title="Edit amount"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
              className="p-1 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
            >
              <Pencil className="h-3 w-3" />
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </div>
        </TableCell>
      </TableRow>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Landmark className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Update Salary Grade
              </h3>
              <p className="text-[10px] text-gray-500">
                Grade <span className="font-mono">{item.grade}</span> · ₱
                {item.amount.toLocaleString("en-PH")} / month
              </p>
            </div>
          </div>
        }
        footer={true}
        yesTitle="Save Changes"
        onOpen={open}
        className="max-w-sm"
        loading={isSubmitting}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOpen(false);
        }}
        onFunction={handleSubmit(onSubmit)}
      >
        <div className="space-y-3 p-1">
          {/* User-count info card */}
          <div className="border rounded-lg bg-gray-50 p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-gray-500" />
              <span className="text-[10px] text-gray-600">
                Currently assigned to
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {userCount} user{userCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          <Form {...form}>
            <FormField
              control={control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Monthly Salary (₱)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        ₱
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="0"
                        className="h-8 text-xs pl-5"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Will apply to all {userCount} user
                    {userCount !== 1 ? "s" : ""} on this grade
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </Form>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(SalaryGradeItem);
