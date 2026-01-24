import { useState, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

//utils
import { searchedChar } from "@/utils/element";
//
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
//
import type { MedicineStock, PrescribeMedProps } from "@/interface/data";
import { PrecribeMedSchema } from "@/interface/zod";
interface Props {
  item: MedicineStock;
  no: number;
  handleAddPresMed: (
    medId: string,
    comment: string,
    quantity: string,
    medName: string
  ) => void;
  query: string;
}
const PrescribeMedItem = ({ item, no, handleAddPresMed, query }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const form = useForm<PrescribeMedProps>({
    resolver: zodResolver(PrecribeMedSchema),
    defaultValues: {
      quantity: "0",
      comment: "",
    },
  });

  const { control, handleSubmit, resetField } = form;

  const onSubmit = (data: PrescribeMedProps) => {
    try {
      handleAddPresMed(
        item.medicine.id,
        data.comment || "",
        data.quantity,
        item.medicine.name
      );
      resetField("comment");
      resetField("quantity");

      setOnOpen(0);
    } catch (error) {
      toast.error("Failed to add", {
        closeButton: false,
      });
    }
  };
  return (
    <>
      <TableRow
        className=" hover:bg-neutral-200 cursor-pointer"
        onClick={() => setOnOpen(1)}
      >
        <TableCell>{no + 1}</TableCell>
        <TableCell>{searchedChar(query, item.medicine.name)}</TableCell>
        <TableCell>{searchedChar(query, item.medicine.serialNumber)}</TableCell>
      </TableRow>
      <Modal
        title={item.medicine.name}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        onFunction={handleSubmit(onSubmit)}
      >
        <div>
          <Form {...form}>
            <FormField
              control={control}
              name="quantity"
              render={({ field }) => (
                <FormItem className="">
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter quantity"
                      className=" bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="comment"
              render={({ field }) => (
                <FormItem className=" mt-4">
                  <FormLabel>Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter quantity"
                      className=" bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default memo(PrescribeMedItem);
