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
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Package, AlertCircle } from "lucide-react";
//
import type { Medicine, PrescribeMedProps } from "@/interface/data";
import { PrecribeMedSchema } from "@/interface/zod";
interface Props {
  item: Medicine;
  no: number;
  handleAddPresMed: (
    medId: string,
    comment: string,
    quantity: string,
    medName: string,
  ) => void;
  query: string;
}
const PrescribeMedItem = ({ item, no, handleAddPresMed, query }: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const form = useForm<PrescribeMedProps>({
    resolver: zodResolver(PrecribeMedSchema),
    defaultValues: {
      quantity: "1",
      comment: "",
    },
  });

  const { control, handleSubmit, resetField } = form;

  const onSubmit = (data: PrescribeMedProps) => {
    try {
      handleAddPresMed(item.id, data.comment || "", data.quantity, item.name);
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
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => setOnOpen(1)}
      >
        <TableCell className="py-2">
          <span className="text-sm font-medium text-gray-600">{no}</span>
        </TableCell>
        <TableCell className="py-2">
          <span className="text-sm font-medium text-gray-800">
            {searchedChar(query, item.name)}
          </span>
        </TableCell>
        <TableCell className="py-2">
          <span className="text-xs font-mono text-gray-500">
            {searchedChar(query, item.serialNumber)}
          </span>
        </TableCell>
      </TableRow>

      <Modal
        title={item.name}
        onOpen={onOpen === 1}
        className="rounded-none lg:rounded-lg w-full h-full lg:h-auto lg:max-h-[90vh] lg:w-auto lg:min-w-[400px] lg:max-w-md overflow-auto"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        onFunction={handleSubmit(onSubmit)}
        yesTitle="Add to Prescription"
      >
        <div className="flex flex-col h-full">
          <Form {...form}>
            <div className="space-y-5">
              {/* Medicine Info Card */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-800">
                    Medicine Details
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">
                    Name:{" "}
                    <span className="font-medium text-gray-800">
                      {item.name}
                    </span>
                  </p>
                  <p className="text-xs text-gray-600">
                    Serial:{" "}
                    <span className="font-mono">{item.serialNumber}</span>
                  </p>
                </div>
              </div>

              {/* Quantity Field */}
              <FormField
                control={control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Quantity <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        className="h-9 text-sm"
                        min="1"
                        step="1"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Number of units to prescribe
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Comment Field */}
              <FormField
                control={control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Comment / Formula
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter dosage instructions or formula..."
                        className="min-h-[100px] text-sm resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional: Add specific instructions for this medicine
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info Alert */}
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This medicine will be added to the prescription list. You can
                  adjust quantity or remove it later.
                </p>
              </div>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
};

export default memo(PrescribeMedItem);
