import { memo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isAxiosError } from "axios";

import { useAuth } from "@/provider/ProtectedRoute";
import { updateUnit, deleteUnit } from "@/db/statement";
import { AddUnitSchema } from "@/interface/zod";
import type { AddUnitProps, Department } from "@/interface/data";

import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Modal from "@/components/custom/Modal";
import ConfirmDelete from "@/layout/ConfirmDelete";
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

import {
  Building2,
  Users,
  Calendar,
  Hash,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

interface Props {
  item: Department;
  no: number;
}

const memberCountColor = (count: number) => {
  if (count === 0) return "bg-gray-50 text-gray-500 border-gray-200";
  if (count <= 5) return "bg-blue-50 text-blue-700 border-blue-200";
  if (count <= 10) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-purple-50 text-purple-700 border-purple-200";
};

const surfaceErr = (err: unknown, fallback: string) =>
  isAxiosError(err)
    ? err.response?.data?.message ?? err.message
    : err instanceof Error
      ? err.message
      : fallback;

const UnitItem = ({ item, no }: Props) => {
  const [onOpen, setOnOpen] = useState(0); // 0 closed · 1 edit · 2 delete
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const nav = useNavigate();
  const { lineId } = useParams();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const editForm = useForm<AddUnitProps>({
    resolver: zodResolver(AddUnitSchema),
    defaultValues: {
      name: item.name ?? "",
      description: item.description ?? "",
    },
  });

  const refreshList = () =>
    queryClient.invalidateQueries({
      queryKey: ["departments", lineId],
      refetchType: "active",
    });

  const editMut = useMutation({
    mutationFn: (vals: AddUnitProps) =>
      updateUnit(auth.token as string, {
        id: item.id,
        name: vals.name,
        description: vals.description,
        userId: auth.userId as string,
        lineId: lineId as string,
      }),
    onSuccess: async () => {
      await refreshList();
      toast.success("Unit updated");
      setOnOpen(0);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to update unit")),
  });

  const removeMut = useMutation({
    mutationFn: () =>
      deleteUnit(
        auth.token as string,
        item.id,
        auth.userId as string,
        lineId as string,
      ),
    onSuccess: async () => {
      await refreshList();
      toast.success("Unit removed");
      setOnOpen(0);
    },
    onError: (err) => toast.error(surfaceErr(err, "Failed to delete unit")),
  });

  const fmtDate = (s?: string) => {
    if (!s) return null;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const userCount = item._count?.users ?? 0;
  const canDelete = userCount === 0;

  const openEdit = () => {
    setDropdownOpen(false);
    editForm.reset({
      name: item.name ?? "",
      description: item.description ?? "",
    });
    setTimeout(() => setOnOpen(1), 80);
  };

  const openDelete = () => {
    setDropdownOpen(false);
    setTimeout(() => setOnOpen(2), 80);
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <li
            className="grid grid-cols-12 gap-2 px-3 py-2 hover:bg-blue-50/40 cursor-pointer items-center"
            onClick={() => nav(item.id)}
          >
            {/* # */}
            <div className="col-span-1 text-[10px] text-gray-500">
              {no.toString().padStart(2, "0")}
            </div>

            {/* Unit info */}
            <div className="col-span-7 min-w-0 flex items-start gap-1.5">
              <div className="p-1 bg-blue-50 rounded flex-shrink-0">
                <Building2 className="h-3 w-3 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {item.name ?? "Untitled"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                  <span className="flex items-center gap-0.5">
                    <Hash className="h-2.5 w-2.5" />
                    <span className="font-mono">
                      {item.id.slice(0, 8)}
                    </span>
                  </span>
                  {fmtDate(item.createdAt) && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="h-2.5 w-2.5" />
                      {fmtDate(item.createdAt)}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Member count */}
            <div className="col-span-3 flex items-center gap-1.5">
              <Users className="h-3 w-3 text-gray-400" />
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${memberCountColor(userCount)}`}
              >
                {userCount} member{userCount === 1 ? "" : "s"}
              </Badge>
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
              <DropdownMenu
                open={dropdownOpen}
                onOpenChange={setDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-[11px] gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit();
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit unit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-[11px] gap-1.5 text-red-600 focus:bg-red-50 focus:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDelete();
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete unit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem className="text-[11px] gap-1.5" onClick={openEdit}>
            <Pencil className="h-3 w-3" />
            Edit unit
          </ContextMenuItem>
          <ContextMenuItem
            className="text-[11px] gap-1.5 text-red-600 focus:bg-red-50 focus:text-red-700"
            onClick={openDelete}
          >
            <Trash2 className="h-3 w-3" />
            Delete unit
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Edit modal */}
      <Modal
        title="Edit Unit"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          if (editMut.isPending) return;
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Save Changes"
        onFunction={editForm.handleSubmit((d) => editMut.mutateAsync(d))}
        loading={editMut.isPending}
      >
        <Form {...editForm}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-1.5 bg-blue-50 rounded">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {item.id.slice(0, 12)}
                </p>
              </div>
            </div>

            <FormField
              control={editForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={editMut.isPending}
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={editForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      disabled={editMut.isPending}
                      className="min-h-[70px] text-xs resize-y"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Optional — describe this unit's role.
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
        footer={1}
        setOnOpen={() => {
          if (removeMut.isPending) return;
          setOnOpen(0);
        }}
      >
        {canDelete ? (
          <ConfirmDelete
            title="Delete unit"
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
              <Users className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-800">
                  Can't delete this unit
                </p>
                <p className="text-[10px] text-red-700 mt-0.5">
                  <strong>{item.name ?? "This unit"}</strong> still has{" "}
                  <strong>{userCount}</strong> user
                  {userCount === 1 ? "" : "s"} assigned. Reassign them to
                  another unit first, then try again.
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

export default memo(UnitItem);
