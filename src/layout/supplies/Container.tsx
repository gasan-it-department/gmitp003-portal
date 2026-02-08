import { useParams } from "react-router";
import { useState, type SetStateAction } from "react";
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
import ConfirmDelete from "../ConfirmDelete";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertTriangle,
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
    <div className="w-full h-full flex flex-col bg-gray-50/30">
      {/* Header Section */}
      <div className="p-4 sm:p-6 border-b bg-white shadow-sm">
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="p-2 sm:p-3 bg-blue-100 rounded-lg sm:rounded-xl flex-shrink-0">
              <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 mb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  {data?.data?.name || "Loading..."}
                </h1>
                <Badge
                  variant="outline"
                  className="font-mono text-xs self-start xs:self-center"
                >
                  {data?.data?.code || "..."}
                </Badge>
              </div>
              {/* Optional description */}
              {/* <p className="text-xs sm:text-sm text-gray-500 truncate">
                {data?.data?.description ||
                  "Manage lists and items in this container"}
              </p> */}
            </div>
          </div>

          {isFetching && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-shrink-0 ml-2">
              <div className="h-3 w-3 sm:h-4 sm:w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <span className="hidden xs:inline">Loading container...</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search lists and items..."
                onChange={(e) => setText(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 flex-1 sm:flex-none"
                >
                  <CircleEllipsis className="h-4 w-4" />
                  <span className="hidden xs:inline">Manage</span>
                  <span className="xs:hidden">Menu</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 sm:w-56 p-2" align="end">
                <div className="space-y-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    disabled
                  >
                    <FolderClock className="h-4 w-4" />
                    <span>Activity Logs</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() =>
                      nav(
                        `/${lineId}/supplies/container/${containerId}/data-set-config`,
                      )
                    }
                  >
                    <FolderCog className="h-4 w-4" />
                    <span>Data Set Config</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() =>
                      nav(
                        `/${lineId}/supplies/container/${containerId}/accessibility`,
                      )
                    }
                    disabled
                  >
                    <Key className="h-4 w-4" />
                    <span>Accessibility</span>
                  </Button>

                  <Separator className="my-1" />

                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setOnOpen(2)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Remove Container</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              onClick={() => setOnOpen(1)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            >
              <ScrollText className="h-4 w-4" />
              <span className="hidden xs:inline">Create List</span>
              <span className="xs:hidden">New List</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
        <Card className="border shadow-sm">
          <CardContent className="p-0">
            <InventoryList query={query} />
          </CardContent>
        </Card>
      </div>

      {/* Create List Modal */}
      <Modal
        onFunction={handleSubmit(onSubmit)}
        footer={true}
        yesTitle="Create List"
        title="Create New List"
        children={
          <div className="w-full space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-blue-800 truncate">
                  {data?.data?.name || "Container"}
                </p>
                <p className="text-xs text-blue-600">
                  Add a new list to this container
                </p>
              </div>
            </div>

            <Form {...form}>
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      List Title *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter list title (e.g., Office Supplies, Equipment List, etc.)"
                        {...field}
                        className="bg-gray-50"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    {errors.title && (
                      <FormMessage>{errors.title.message}</FormMessage>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Give your list a clear, descriptive name
                    </p>
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md mx-4 sm:mx-auto"
        setOnOpen={() => setOnOpen(0)}
        loading={isSubmitting}
      />

      {/* Remove Container Modal */}
      <Modal
        title={
          <div className="flex flex-col items-center text-center">
            <div className="p-3 sm:p-4 bg-red-50 rounded-full mb-3 sm:mb-4">
              <Trash2 className="h-8 w-8 sm:h-12 sm:w-12 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
              Remove Container
            </h3>
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
        className="max-w-lg max-h-[95vh] overflow-auto mx-4 sm:mx-auto"
        setOnOpen={() => setOnOpen(0)}
        footer={1}
        loading={removeContainer.isPending}
        onFunction={() => {
          if (isFetching) return;
          removeContainer.mutate();
        }}
        yesTitle="Remove Container"
      />
    </div>
  );
};

export default Container;
