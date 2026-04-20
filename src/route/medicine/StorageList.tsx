import { useState } from "react";
import useMedSideBar from "@/hooks/useMedSideBar";
//
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import SelectUnit from "@/layout/medicine/SelectUnit";
import Notification from "@/layout/medicine/Notification";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
//
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import hotkeys from "hotkeys-js";
import axios from "@/db/axios";
//
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { storageList } from "@/db/statement";

//
import {
  Logs,
  ChevronRight,
  Menu,
  Search,
  FileCog,
  Package,
  AlertCircle,
  Plus,
} from "lucide-react";

//interfaces and Props
import type {
  MedicineStorage,
  NewStorageLocationProps,
} from "@/interface/data";
import { NewStorageLocationSchema } from "@/interface/zod";
import StorageItem from "@/layout/medicine/item/StorageItem";

import MedicineDashboard from "@/layout/medicine/MedicineDashboard";
interface ListProps {
  list: MedicineStorage[];
  lastCursor: string | null;
  hasMore: boolean;
}

const StorageList = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { lineId } = useParams();
  const medSideBar = useMedSideBar();

  const auth = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const { data, isFetching } = useInfiniteQuery<ListProps>({
    queryKey: ["storage-list", lineId],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
    queryFn: ({ pageParam }) =>
      storageList(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "10",
        "",
      ),
    enabled: !!lineId,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const form = useForm({
    resolver: zodResolver(NewStorageLocationSchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
  } = form;

  const onSubmit = async (data: NewStorageLocationProps) => {
    if (!lineId) return toast.error("Line ID is missing.");
    if (!auth.token) return toast.error("Unauthorized access.");
    if (!auth.userId) return toast.error("User ID is missing.");

    try {
      const response = await axios.post(
        "/medicine/storage/add-storage-location",
        {
          lineId: lineId,
          name: data.name,
          desc: data.desc,
          userId: auth.userId,
          departmentId: data.departmentId,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );
      if (response.status !== 200) {
        return toast.error("Failed to add storage location.");
      }
      await queryClient.invalidateQueries({
        queryKey: ["storage-list", lineId],
        refetchType: "active",
      });
      toast.success("Storage location added successfully.");
      reset();
      setOnOpen(0);
    } catch (error) {
      toast.error("Failed to add new storage location.", {
        description: "Something went wrong.",
      });
    }
  };

  hotkeys("ctrl+d", (e) => {
    e.preventDefault();
    nav(`dispensary-release`);
  });

  hotkeys("ctrl+k", (e) => {
    e.preventDefault();
    if (onOpen === 2) {
      return setOnOpen(0);
    }
    setOnOpen(2);
  });

  const allStorages = data?.pages.flatMap((item) => item.list) || [];

  return (
    <div className="w-full h-full flex bg-gradient-to-br from-gray-50 to-gray-100">
      <TooltipProvider>
        {/* Main Content Area */}
        <div
          className={`${medSideBar.onOpen ? "w-3/4" : "w-full"} h-full flex flex-col`}
        >
          {/* Header Toolbar */}
          <div className="bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="px-4 py-3 flex items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <Tooltip delayDuration={1000}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOnOpen(2)}
                      className="gap-2"
                    >
                      <Search className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Search</span>
                      <KbdGroup className="hidden md:flex">
                        <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
                      </KbdGroup>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search Medicine (Ctrl+K)</TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={1000}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => nav(`logs`)}
                      className="gap-2"
                    >
                      <Logs className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Logs</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Activity Logs</TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={1000}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => nav(`config`)}
                      className="gap-2"
                    >
                      <FileCog className="h-4 w-4" />
                      <span className="hidden sm:inline text-xs">Settings</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Storage Settings</TooltipContent>
                </Tooltip>

                <Button
                  size="sm"
                  onClick={() => setOnOpen(1)}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Storage</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Storage Grid */}
          <div className="h-auto overflow-auto p-4">
            {isFetching ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-gray-500">
                  Loading storage locations...
                </p>
              </div>
            ) : allStorages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allStorages.map((item) => (
                  <StorageItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-auto text-center">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  No Storage Locations
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create your first storage location to start managing medicines
                </p>
                <Button
                  onClick={() => setOnOpen(1)}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Storage Location
                </Button>
              </div>
            )}
          </div>
          <MedicineDashboard
            token={auth.token as string}
            lineId={lineId as string}
          />
        </div>

        {/* Sidebar */}
        <div
          className={`${
            medSideBar.onOpen ? "w-80" : "w-auto"
          } h-full border border-b-0 bg-white shadow-lg transition-all duration-300`}
        >
          <div className="border-b px-3 py-2 flex justify-end">
            <Button
              size="sm"
              onClick={() => medSideBar.setOnOpen()}
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              {medSideBar.onOpen ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="h-[calc(100%-45px)] overflow-auto p-2">
            {medSideBar.onOpen && (
              <Notification lineId={lineId} token={auth.token} />
            )}
          </div>
        </div>

        {/* Search Modal */}
        <Modal
          title="Search Medicine"
          children={undefined}
          onOpen={onOpen === 2}
          className="max-w-2xl"
          setOnOpen={() => setOnOpen(0)}
          cancelTitle="Close"
        />

        {/* Add Storage Location Modal */}
        <Modal
          title="Add Storage Location"
          onOpen={onOpen === 1}
          className="max-w-md overflow-auto"
          setOnOpen={() => {
            if (isFetching || isSubmitting) return;
            reset();
            setOnOpen(0);
          }}
          footer={true}
          yesTitle="Create Storage"
          onFunction={handleSubmit(onSubmit)}
          loading={isSubmitting}
        >
          <div className="space-y-5 p-1">
            <div className="flex items-center gap-3 pb-3 border-b">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  New Storage Location
                </h3>
                <p className="text-xs text-gray-500">
                  Create a new storage area for medicines
                </p>
              </div>
            </div>

            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Storage Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Main Pharmacy, Emergency Stock, Ward A"
                          disabled={isSubmitting}
                          className="h-9 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        A clear, descriptive name for this storage location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="desc"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[80px] resize-y text-sm"
                          disabled={isSubmitting}
                          placeholder="Describe the storage location, its purpose, and any special notes..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Optional: Additional information about this storage area
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Assigned Unit/Department
                      </FormLabel>
                      <FormControl>
                        <div className="border rounded-md p-2 bg-gray-50">
                          <SelectUnit
                            onChange={field.onChange}
                            lineId={lineId as string}
                            auth={auth}
                            currentValue={field.value}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Select the department responsible for this storage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Info Alert */}
                <div className="rounded-md bg-blue-50 p-3 border border-blue-100">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-900 mb-0.5">
                        About Storage Locations
                      </p>
                      <p className="text-xs text-blue-700">
                        Storage locations help organize medicines by area. Each
                        location can track inventory levels and manage stock.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </div>
        </Modal>
      </TooltipProvider>
    </div>
  );
};

export default StorageList;
