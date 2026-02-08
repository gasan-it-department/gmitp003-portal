import { useState, memo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//
import { TableRow, TableCell } from "@/components/ui/table";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  //FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
//import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import ItemAvailabilitiy from "../ItemAvailabilitiy";
//
//import { SearchCheck } from "lucide-react";
//
import type { SupplyOrder, PurchaseReqProps } from "@/interface/data";
import { PurchaseReqSchema } from "@/interface/zod";

interface Props {
  item: SupplyOrder;
  no: number;
}
const PRListItem = ({ item, no }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const form = useForm<PurchaseReqProps>({
    resolver: zodResolver(PurchaseReqSchema),
    defaultValues: {
      item: item.supply.item,
      quantity: item.quantity.toString(),
      remark: "2",
    },
  });
  return (
    <>
      <TableRow
        className=" hover:bg-neutral-200 cursor-pointer"
        onClick={() => setOnOpen(1)}
      >
        <TableCell>{no + 1}</TableCell>
        <TableCell>{item.supply.item}</TableCell>
        <TableCell className=" max-w-40">{item.desc || "N/A"}</TableCell>
        <TableCell>{item.quantity}</TableCell>
        <TableCell>{item.price}</TableCell>
        <TableCell>{item.quantity * item.quantity}</TableCell>
        <TableCell>{item.remark}</TableCell>
      </TableRow>
      <Modal
        title={`${item.supply.item}`}
        onOpen={onOpen === 1}
        className={" min-w-lg"}
        setOnOpen={() => {
          setOnOpen(0);
        }}
        cancelTitle="Close"
        footer={true}
      >
        <p className=" text-sm">
          <b>Description:</b> {item.desc}
        </p>
        <div className=" grid grid-cols-2 gap-2 mt-2">
          <Form {...form}>
            <p>Requested Quantity: {item.quantity}</p>
            <FormField
              name="quantity"
              render={({ field: { onBlur, onChange, value } }) => (
                <FormItem>
                  <FormControl defaultValue={item.quantity.toString()}>
                    <Input
                      placeholder=""
                      type="number"
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <p>Remark: </p>
            <FormField
              name=""
              render={({ field: { onChange, value } }) => (
                <Select
                  defaultValue="2"
                  onValueChange={(e) => onChange(e)}
                  value={value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Remark" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Drafted</SelectItem>
                    <SelectItem value="1">Pending</SelectItem>
                    <SelectItem value="2">OK</SelectItem>
                    <SelectItem value="3">Drafted</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <FormField
              name=""
              render={() => (
                <FormField
                  name="comment"
                  render={({ field }) => (
                    <FormItem className=" col-span-2 mt-2">
                      <FormLabel>Comment (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          className=" max-h-20"
                          placeholder=""
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            />
          </Form>
        </div>
        <div className=" w-full mt-2 border border-neutral-400 rounded p-2">
          <ItemAvailabilitiy />
        </div>
      </Modal>
    </>
  );
};

export default memo(PRListItem);
