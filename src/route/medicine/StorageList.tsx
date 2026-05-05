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
    <div className="w-full h-full flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 to-gray-100">
      <TooltipProvider>
        {/* Main Content Area */}
        <div
          className={`${medSideBar.onOpen ? "lg:w-3/4" : "lg:w-full"} w-full h-full flex flex-col`}
        >
          {/* Header Toolbar - Mobile Responsive */}
          <div className="bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center justify-end gap-2 sm:gap-3">
                {/* Mobile: Show icons only, Desktop: Show text */}
                <Tooltip delayDuration={1000}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOnOpen(2)}
                      className="gap-1 sm:gap-2 px-2 sm:px-3"
                    >
                      <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                      className="gap-1 sm:gap-2 px-2 sm:px-3"
                    >
                      <Logs className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                      className="gap-1 sm:gap-2 px-2 sm:px-3"
                    >
                      <FileCog className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline text-xs">Settings</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Storage Settings</TooltipContent>
                </Tooltip>

                <Button
                  size="sm"
                  onClick={() => setOnOpen(1)}
                  className="gap-1 sm:gap-2 px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline text-xs sm:text-sm">
                    Add
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Storage Grid - Responsive */}
          <div className="flex-1 overflow-auto p-3 sm:p-4 ">
            {isFetching ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Spinner className="h-6 w-6 sm:h-8 sm:w-8" />
                <p className="text-xs sm:text-sm text-gray-500">
                  Loading storage locations...
                </p>
              </div>
            ) : allStorages.length > 0 ? (
              <div className=" w-full h-full grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr">
                {allStorages.map((item) => (
                  <StorageItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center py-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                  No Storage Locations
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 max-w-[250px] sm:max-w-none">
                  Create your first storage location to start managing medicines
                </p>
                <Button
                  onClick={() => setOnOpen(1)}
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Add Storage Location
                </Button>
              </div>
            )}
          </div>

          {/* Medicine Dashboard */}
          <div className="border-t bg-white/50">
            <MedicineDashboard
              token={auth.token as string}
              lineId={lineId as string}
            />
          </div>
        </div>

        {/* Sidebar - Mobile Responsive */}
        <div
          className={`${
            medSideBar.onOpen ? "w-64 sm:w-80" : "w-auto"
          } h-full border-l border-t-0 bg-white shadow-lg transition-all duration-300 absolute lg:relative right-0 top-0 z-20 lg:z-auto ${
            medSideBar.onOpen
              ? "translate-x-0"
              : "translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="border-b px-2 sm:px-3 py-2 flex justify-between items-center lg:justify-end">
            <span className="text-sm font-medium text-gray-600 lg:hidden">
              Notifications
            </span>
            <Button
              size="sm"
              onClick={() => medSideBar.setOnOpen()}
              variant="ghost"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              {medSideBar.onOpen ? (
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              ) : (
                <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
          <div className="h-[calc(100%-45px)] overflow-auto p-2">
            {medSideBar.onOpen && (
              <Notification lineId={lineId} token={auth.token} />
            )}
          </div>
        </div>

        {/* Mobile overlay when sidebar is open */}
        {medSideBar.onOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-10 lg:hidden"
            onClick={() => medSideBar.setOnOpen()}
          />
        )}

        {/* Search Modal */}
        <Modal
          title="Search Medicine"
          children={undefined}
          onOpen={onOpen === 2}
          className="max-w-2xl mx-3 sm:mx-auto"
          setOnOpen={() => setOnOpen(0)}
          cancelTitle="Close"
        />

        {/* Add Storage Location Modal - Mobile Responsive */}
        <Modal
          title="Add Storage Location"
          onOpen={onOpen === 1}
          className="max-w-md w-[95vw] sm:w-auto overflow-auto mx-3 sm:mx-auto"
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
          <div className="space-y-4 sm:space-y-5 p-2 sm:p-1">
            <div className="flex items-center gap-2 sm:gap-3 pb-2 sm:pb-3 border-b">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  New Storage Location
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  Create a new storage area for medicines
                </p>
              </div>
            </div>

            <Form {...form}>
              <div className="space-y-3 sm:space-y-4">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                        Storage Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Main Pharmacy"
                          disabled={isSubmitting}
                          className="h-8 sm:h-9 text-xs sm:text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] sm:text-xs">
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
                      <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[70px] sm:min-h-[80px] resize-y text-xs sm:text-sm"
                          disabled={isSubmitting}
                          placeholder="Describe the storage location..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px] sm:text-xs">
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
                      <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
                        Assigned Unit/Department
                      </FormLabel>
                      <FormControl>
                        <div className="border rounded-md p-1.5 sm:p-2 bg-gray-50">
                          <SelectUnit
                            onChange={field.onChange}
                            lineId={lineId as string}
                            auth={auth}
                            currentValue={field.value}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px] sm:text-xs">
                        Select the department responsible for this storage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Info Alert */}
                <div className="rounded-md bg-blue-50 p-2.5 sm:p-3 border border-blue-100">
                  <div className="flex gap-1.5 sm:gap-2">
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[10px] sm:text-xs font-medium text-blue-900 mb-0.5">
                        About Storage Locations
                      </p>
                      <p className="text-[10px] sm:text-xs text-blue-700">
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
