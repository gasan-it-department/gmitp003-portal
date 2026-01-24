import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
//
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormMessage,
  FormDescription,
  FormItem,
  FormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
//
import type { SalaryGrade, UpdateSalaryGradeProps } from "@/interface/data";
import { Users } from "lucide-react";
import { UpdateSalaryGradeSchema } from "@/interface/zod";

interface Props {
  item: SalaryGrade;
  token: string;
  userId: string;
  lineId: string;
}

const SalaryGradeItem = ({ item, userId, token, lineId }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const queryClient = useQueryClient();

  const form = useForm<UpdateSalaryGradeProps>({
    resolver: zodResolver(UpdateSalaryGradeSchema),
    defaultValues: {
      amount: item.amount.toString(),
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
  } = form;

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
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["salary-grade", lineId],
        refetchType: "active",
      });
      setOnOpen(0);
    } catch (error) {
      console.log(error);

      toast.error(`${error}`);
    }
  };
  return (
    <>
      <TableRow
        key={item.id}
        onClick={() => setOnOpen(1)}
        className=" transition-colors group  hover:bg-gray-200 cursor-pointer"
      >
        <TableCell className="text-center font-bold">
          <Badge variant="outline" className="px-3 py-1.5 text-base">
            {item.grade}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="font-semibold text-lg">
            ${item.amount.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">per month</div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {item._count.users || 0} user
              {item._count.users !== 1 ? "s" : ""}
            </span>
          </div>
        </TableCell>
      </TableRow>
      <Modal
        title={undefined}
        children={
          <div>
            <Form {...form}>
              <FormField
                control={control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormDescription>
                      Enter the new salary amount
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter new salary amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        footer={true}
        onOpen={onOpen === 1}
        className={""}
        loading={isSubmitting}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        onFunction={handleSubmit(onSubmit)}
      />
    </>
  );
};

export default memo(SalaryGradeItem);
