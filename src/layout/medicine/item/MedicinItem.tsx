import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  removeMedicine,
  updateMedicine,
} from "@/db/statements/medicine";

import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";

import {
  Package,
  Hash,
  AlertTriangle,
  Trash2,
  Pencil,
  Loader2,
} from "lucide-react";

import type { Medicine, ProtectedRouteProps } from "@/interface/data";
import { AddNewMedicineSchema } from "@/interface/zod";
import type { AddNewMedicineProps } from "@/interface/data";

interface Props {
  item: Medicine;
  no: number;
  lineId: string;
  auth: ProtectedRouteProps;
}

const MedicinItem = ({ item, no, lineId, auth }: Props) => {
  const [onOpen, setOnOpen] = useState(0); // 0=closed, 1=edit, 2=delete
  const queryClient = useQueryClient();

  const form = useForm<AddNewMedicineProps>({
    resolver: zodResolver(AddNewMedicineSchema),
    defaultValues: { name: item.name, desc: item.desc ?? "" },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
  } = form;

  const refreshList = () =>
    queryClient.invalidateQueries({
      queryKey: ["medicine-list", lineId],
      refetchType: "active",
    });

  const editMut = useMutation({
    mutationFn: (data: AddNewMedicineProps) =>
      updateMedicine(auth.token as string, {
        id: item.id,
        name: data.name,
        desc: data.desc,
        userId: auth.userId as string,
        lineId,
      }),
    onSuccess: async () => {
      await refreshList();
      toast.success("Medicine updated");
      setOnOpen(0);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Failed to update"),
      );
    },
  });

  const removeMut = useMutation({
    mutationFn: () =>
      removeMedicine(
        auth.token as string,
        item.id,
        auth.userId as string,
        lineId,
      ),
    onSuccess: async () => {
      await refreshList();
      toast.success("Medicine removed");
      setOnOpen(0);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Failed to remove medicine"),
      );
    },
  });

  const batches = item.stats?.batches ?? 0;
  const units = item.stats?.totalUnits ?? 0;
  const canDelete = units === 0;

  return (
    <>
      <TableRow className="hover:bg-gray-50">
        <TableCell className="text-[10px] text-gray-500">{no}</TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <Hash className="h-2.5 w-2.5 text-gray-400" />
            <code className="text-[11px] font-mono text-gray-700">
              {item.serialNumber}
            </code>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-start gap-2">
            <div className="p-1 bg-blue-50 rounded flex-shrink-0">
              <Package className="h-3 w-3 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">
                {item.name}
              </p>
              {item.desc && (
                <p className="text-[10px] text-gray-500 truncate max-w-xs">
                  {item.desc}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 font-mono"
          >
            {batches}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 font-mono ${
              units === 0
                ? "bg-gray-50 text-gray-500"
                : units < 10
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {units}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => {
                reset({ name: item.name, desc: item.desc ?? "" });
                setOnOpen(1);
              }}
              title="Edit"
            >
              <Pencil className="h-3 w-3 text-gray-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
              onClick={() => setOnOpen(2)}
              title={
                canDelete
                  ? "Remove medicine"
                  : "Cannot remove — stock still on hand"
              }
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Edit modal */}
      <Modal
        title="Edit Medicine"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          if (editMut.isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Save Changes"
        onFunction={handleSubmit((d) => editMut.mutateAsync(d))}
        loading={editMut.isPending}
      >
        <Form {...form}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-1.5 bg-blue-50 rounded">
                <Package className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {item.name}
                </p>
                <code className="text-[10px] font-mono text-gray-500">
                  {item.serialNumber}
                </code>
              </div>
            </div>

            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting || editMut.isPending}
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      disabled={isSubmitting || editMut.isPending}
                      className="min-h-[70px] text-xs resize-y"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Serial number stays the same — it's permanently linked to
                    history and labels.
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
          </div>
        </Form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        title={undefined}
        onOpen={onOpen === 2}
        className=""
        setOnOpen={() => {
          if (removeMut.isPending) return;
          setOnOpen(0);
        }}
        footer={1}
      >
        {canDelete ? (
          <ConfirmDelete
            title="Remove medicine"
            confirmation="confirm"
            setOnOpen={() => {
              if (!removeMut.isPending) setOnOpen(0);
            }}
            onFunction={() => {
              if (!removeMut.isPending) removeMut.mutateAsync();
            }}
            isLoading={removeMut.isPending}
          />
        ) : (
          <div className="p-3 space-y-3">
            <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-100 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-800">
                  Can't remove this medicine
                </p>
                <p className="text-[10px] text-red-700 mt-0.5">
                  <strong>{item.name}</strong> still has{" "}
                  <strong>{units}</strong> unit{units === 1 ? "" : "s"} on hand
                  across <strong>{batches}</strong> batch
                  {batches === 1 ? "" : "es"}. Zero out or transfer the stock
                  before removing.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px]"
                onClick={() => setOnOpen(0)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
        {removeMut.isPending && (
          <div className="flex items-center justify-center gap-1.5 py-2 text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-[10px]">Removing...</span>
          </div>
        )}
      </Modal>
    </>
  );
};

export default memo(MedicinItem);
