import { useParams } from "react-router";
import { useState } from "react";
//
import { getContainerData } from "@/db/statement";
//
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/provider/UserProvider";
import { useAuth } from "@/provider/ProtectedRoute";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "use-debounce";
import axios from "@/db/axios";
//
import type { InventoryBoxProps, CreateListProps } from "@/interface/data";
import { CreateListSchame } from "@/interface/zod";
//
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  PageShell,
  Toolbar,
  PageBody,
  Panel,
} from "@/components/custom/page";
import ConfirmDelete from "../ConfirmDelete";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Form,
  FormControl,
  FormItem,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
//icons
import {
  FolderCog,
  ScrollText,
  FolderClock,
  CircleEllipsis,
  Key,
  Trash2,
  Package,
  Search,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import InventoryList from "./InventoryList";

const Container = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const { containerId, lineId } = useParams();
  const { user } = useUser();
  const { token, userId } = useAuth();
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery<{ data: InventoryBoxProps }>({
    queryFn: () =>
      getContainerData(
        token as string,
        containerId as string,
        userId as string,
      ),
    queryKey: ["container", containerId],
    enabled: !!token || !!containerId,
  });

  const form = useForm<CreateListProps>({
    resolver: zodResolver(CreateListSchame),
    defaultValues: {
      title: "",
    },
  });
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    reset,
  } = form;

  const nav = useNavigate();

  const handleRemoveContainer = async () => {
    await axios.delete("/inventory/delete", {
      params: {
        id: containerId,
        userId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  };

  const removeContainer = useMutation({
    mutationFn: handleRemoveContainer,
    onSuccess: async () => {
      toast.success("Container removed successfully!", {
        closeButton: false,
      });
      nav(-1);
      await queryClient.invalidateQueries({
        queryKey: ["container", user?.id as string],
        refetchType: "active",
      });
    },
    onError: (error) => {
      toast.error("Failed to remove container!", {
        closeButton: false,
      });
      console.log(error);
    },
  });

  const onSubmit = async (data: CreateListProps) => {
    if (!lineId || !containerId) {
      return toast.warning("Required data not found!");
    }
    try {
      const response = await axios.post(
        "/create-list",
        {
          title: data.title,
          inventoryBoxId: containerId,
          lineId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );
      if (response.status !== 200) {
        toast.error("Failed to create list", {
          closeButton: false,
        });
        throw new Error(`${response.data}`);
      }
      reset();
      setOnOpen(0);
      await queryClient.invalidateQueries({
        queryKey: ["container-list", containerId],
        refetchType: "active",
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <PageShell>
      {/*
        One strip, not two. The container's name, its code and every control
        that acts on it sit on the same line, which is what HR does and what
        keeps the list itself above the fold on a counter PC.
      */}
      <Toolbar icon={FolderOpen} title={data?.data?.name || "Loading…"}>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 font-mono shrink-0"
        >
          {data?.data?.code || "…"}
        </Badge>

        <div className="flex-1 min-w-[160px]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Search lists..."
              onChange={(e) => setText(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>

        {isFetching && (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 shrink-0" />
        )}

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <CircleEllipsis className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-1.5" align="end">
                  <div className="space-y-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-7 text-xs"
                      disabled
                    >
                      <FolderClock className="h-3.5 w-3.5" />
                      Activity Logs
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-7 text-xs"
                      onClick={() =>
                        nav(
                          `/${lineId}/supplies/container/${containerId}/data-set-config`,
                        )
                      }
                    >
                      <FolderCog className="h-3.5 w-3.5" />
                      Data Set Config
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-7 text-xs"
                      onClick={() =>
                        nav(
                          `/${lineId}/supplies/container/${containerId}/accessibility`,
                        )
                      }
                      disabled
                    >
                      <Key className="h-3.5 w-3.5" />
                      Accessibility
                    </Button>

                    <Separator className="my-1" />

                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full justify-start gap-2 h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setOnOpen(2)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove Container
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                size="sm"
                onClick={() => setOnOpen(1)}
                className="gap-1.5 h-8 text-xs"
              >
                <ScrollText className="h-3 w-3" />
                New List
              </Button>
            </div>
      </Toolbar>

      <PageBody>
        <Panel>
          <InventoryList query={query} />
        </Panel>
      </PageBody>

      {/* Create List Modal - Compact */}
      <Modal
        onFunction={handleSubmit(onSubmit)}
        footer={true}
        yesTitle="Create List"
        title={
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="text-sm font-semibold">Create New List</span>
          </div>
        }
        children={
          <div className="space-y-3 p-1">
            <div className="p-2 bg-blue-50 rounded-md">
              <p className="text-xs font-medium text-blue-800 truncate">
                {data?.data?.name || "Container"}
              </p>
              <p className="text-[10px] text-blue-600">
                Add a new list to this container
              </p>
            </div>

            <Form {...form}>
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">
                      List Title *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Office Supplies"
                        {...field}
                        className="h-8 text-sm"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    {errors.title && (
                      <FormMessage className="text-[10px]">
                        {errors.title.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[90vw]"
        setOnOpen={() => {
          reset();
          setOnOpen(0);
        }}
        loading={isSubmitting}
      />

      {/* Remove Container Modal - Compact */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-md">
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </div>
            <span className="text-sm font-semibold">Remove Container</span>
          </div>
        }
        children={
          <ConfirmDelete
            confirmation={"confirm"}
            setOnOpen={setOnOpen}
            onFunction={() => {
              removeContainer.mutateAsync();
            }}
            isLoading={removeContainer.isPending}
          />
        }
        onOpen={onOpen === 2}
        className="max-w-md w-[90vw]"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        loading={removeContainer.isPending}
        yesTitle="Remove Container"
      />
    </PageShell>
  );
};

export default Container;
