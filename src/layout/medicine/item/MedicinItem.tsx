import { memo, useState } from "react";
//
import { zodResolver } from "@hookform/resolvers/zod";
//
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
//statements
import { removeMedicine } from "@/db/statements/medicine";

//
import { TableRow, TableCell } from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import SelectUnit from "../SelectUnit";
import ConfirmDelete from "@/layout/ConfirmDelete";
import { toast } from "sonner";
//icons
import {
  Package,
  Hash,
  Tag,
  FileText,
  AlertTriangle,
  Warehouse,
  Trash2,
} from "lucide-react";
//
import type {
  Medicine,
  MedicineActionProps,
  ProtectedRouteProps,
} from "@/interface/data";
import { MedicineActionSchema } from "@/interface/zod";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  item: Medicine;
  no: number;
  lineId: string;
  auth: ProtectedRouteProps;
  onMultiSelect: boolean;
}

const MedicinItem = ({ item, no, lineId, auth, onMultiSelect }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const form = useForm<MedicineActionProps>({
    resolver: zodResolver(MedicineActionSchema),
    defaultValues: {
      unitId: "",
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
  } = form;

  const removeMedicineMutation = useMutation({
    mutationFn: () =>
      removeMedicine(auth.token as string, item.id, auth.userId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medicine-list", lineId],
      });
      setOnOpen(0);
    },
    onError: () => {
      toast.error("Failed to remove medicine. Please try again.");
    },
  });
  const queryClient = useQueryClient();

  return (
    <>
      <TableRow className="group hover:bg-blue-50/50 cursor-pointer transition-colors">
        {onMultiSelect && (
          <TableCell className="border-r">
            <div className="flex items-center">
              <Checkbox className="border-gray-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600" />
            </div>
          </TableCell>
        )}
        <TableCell className="border-r py-4">
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="font-mono text-xs">
              {no}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="border-r py-4">
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-gray-400" />
            <code className="font-mono text-sm bg-gray-50 px-2 py-1 rounded border">
              {item.serialNumber}
            </code>
          </div>
        </TableCell>
        <TableCell className="py-4">
          <div className="flex items-center gap-3" onClick={() => setOnOpen(1)}>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">
                {item.name}
              </p>
              {item.desc && (
                <p className="text-xs text-gray-500 truncate max-w-xs">
                  {item.desc}
                </p>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="outline" className="text-xs">
                Manage
              </Badge>
            </div>
          </div>
        </TableCell>
        <TableCell className="border-l py-4">
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-all"
            onClick={() => setOnOpen(1)}
          >
            <Package className="h-4 w-4 mr-2" />
            Actions
          </Button>
        </TableCell>
      </TableRow>

      {/* Medicine Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {item.name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Hash className="h-3 w-3" />
                <code className="font-mono">{item.serialNumber}</code>
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md max-h-[90vh] overflow-y-auto"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Close"
      >
        <div className="space-y-4">
          {/* Medicine Information */}
          <Card className="border-0 bg-gray-50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicine Name
                    </p>
                    <p className="font-medium">{item.name}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serial Number
                    </p>
                    <code className="font-mono text-sm bg-white px-2 py-1 rounded border">
                      {item.serialNumber}
                    </code>
                  </div>
                </div>

                {item.desc && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </p>
                        <p className="text-sm text-gray-700">{item.desc}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Available Actions
            </p>

            <Button
              variant="outline"
              className="w-full justify-start h-12 px-4 hover:bg-blue-50 hover:border-blue-200"
              onClick={() => setOnOpen(2)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded">
                  <Warehouse className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Stock to Storage</p>
                  <p className="text-xs text-gray-500">
                    Add stock to a specific unit or department
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12 px-4 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              onClick={() => setOnOpen(2)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Reset All Records</p>
                  <p className="text-xs text-gray-500">
                    Clear all transaction history for this medicine
                  </p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start h-12 px-4 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              onClick={() => setOnOpen(3)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">Remove</p>
                  <p className="text-xs text-gray-500">
                    Permanently delete this medicine from the system
                  </p>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stock to Storage Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Warehouse className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Stock to Storage
              </h2>
              <p className="text-sm text-gray-500">
                Select destination for {item.name}
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-lg max-h-[95vh] overflow-y-auto"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        loading={isSubmitting}
        onFunction={handleSubmit(() => {
          // Handle form submission
          console.log("Form submitted");
        })}
        cancelTitle="Cancel"
      >
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Medicine: {item.name}
                </p>
                <p className="text-xs text-blue-600">
                  Serial: {item.serialNumber}
                </p>
              </div>
            </div>
          </div>

          <Card className="border">
            <CardContent className="p-4">
              <Form {...form}>
                <FormField
                  control={control}
                  name="unitId"
                  render={({ field: { onChange, value } }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Select Destination Unit
                      </FormLabel>
                      <div className="mt-2">
                        <FormControl>
                          <SelectUnit
                            onChange={onChange}
                            lineId={lineId}
                            auth={auth}
                            currentValue={value}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="text-xs mt-1" />
                      <p className="text-xs text-gray-500 mt-2">
                        Choose the office, department, or unit where this
                        medicine will be stocked.
                      </p>
                    </FormItem>
                  )}
                />
              </Form>
            </CardContent>
          </Card>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">
                  Important Note
                </p>
                <p className="text-xs text-amber-700">
                  This action will transfer the selected quantity of {item.name}{" "}
                  to the chosen unit. This cannot be undone automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Remove Medicine
              </h2>
              <p className="text-sm text-gray-500">
                This action cannot be undone
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 3}
        className="max-w-md max-h-[90vh] overflow-y-auto"
        loading={removeMedicineMutation.isPending}
        setOnOpen={() => {
          if (removeMedicineMutation.isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        onFunction={() => {
          removeMedicineMutation.mutateAsync();
        }}
        yesTitle="Yes, Remove"
        cancelTitle="Cancel"
      >
        <div className="space-y-4">
          {/* Warning Alert */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 mb-1">
                  Are you absolutely sure?
                </p>
                <p className="text-sm text-red-700">
                  This action will permanently remove{" "}
                  <span className="font-semibold">{item.name}</span> from the
                  system.
                </p>
              </div>
            </div>
          </div>

          {/* Medicine Details Card */}
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Medicine:
                  </span>
                  <span className="text-sm text-gray-900">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Serial:
                  </span>
                  <code className="text-sm bg-gray-100 px-2 py-0.5 rounded">
                    {item.serialNumber}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consequences */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              This will:
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                <span>Remove all records associated with this medicine</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                <span>Delete from inventory and transaction history</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                <span>This action is permanent and cannot be reversed</span>
              </li>
            </ul>
          </div>

          {/* Loading State */}
          {removeMedicineMutation.isPending && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600" />
                Removing medicine...
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default memo(MedicinItem);
