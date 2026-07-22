import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import hotkeys from "hotkeys-js";

import useMedSideBar from "@/hooks/useMedSideBar";
import { useAuth } from "@/provider/ProtectedRoute";
import { storageList } from "@/db/statement";
import axios from "@/db/axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

import SelectUnit from "@/layout/medicine/SelectUnit";
import Notification from "@/layout/medicine/Notification";
import MedicineSearch from "@/layout/medicine/MedicineSearch";
import StorageItem from "@/layout/medicine/item/StorageItem";
import MedicineDashboard from "@/layout/medicine/MedicineDashboard";

import {
  Logs,
  ChevronRight,
  ChevronLeft,
  Search,
  FileCog,
  Package,
  AlertCircle,
  Plus,
  Bell,
  Loader2,
} from "lucide-react";

import type {
  MedicineStorage,
  NewStorageLocationProps,
} from "@/interface/data";
import { NewStorageLocationSchema } from "@/interface/zod";

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
          lineId,
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
      toast.success("Storage location added.");
      reset();
      setOnOpen(0);
    } catch {
      toast.error("Failed to add new storage location.");
    }
  };

  hotkeys("ctrl+d", (e) => {
    e.preventDefault();
    nav(`dispensary-release`);
  });

  hotkeys("ctrl+k", (e) => {
    e.preventDefault();
    setOnOpen((o) => (o === 2 ? 0 : 2));
  });

  const allStorages = data?.pages.flatMap((item) => item.list) || [];

  return (
    <TooltipProvider>
      <div className="w-full h-full flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

        {/* ── Main column ───────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Toolbar */}
          <div className="bg-white border-b flex-shrink-0">
            <div className="px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Package className="h-3 w-3 text-blue-500" />
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-gray-800 truncate">
                    Storage Locations
                  </h3>
                  <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                    {isFetching && allStorages.length === 0
                      ? "Loading..."
                      : `${allStorages.length} location${allStorages.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOnOpen(2)}
                      className="h-7 text-[10px] gap-1.5"
                    >
                      <Search className="h-3 w-3" />
                      <span className="hidden sm:inline">Search</span>
                      <KbdGroup className="hidden md:flex">
                        <Kbd className="text-[9px]">Ctrl</Kbd>
                        <Kbd className="text-[9px]">K</Kbd>
                      </KbdGroup>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-[10px]">
                    Search Medicine (Ctrl+K)
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => nav(`logs`)}
                      className="h-7 text-[10px] gap-1.5"
                    >
                      <Logs className="h-3 w-3" />
                      <span className="hidden sm:inline">Logs</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-[10px]">
                    Activity Logs
                  </TooltipContent>
                </Tooltip>

                <Tooltip delayDuration={500}>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => nav(`config`)}
                      className="h-7 text-[10px] gap-1.5"
                    >
                      <FileCog className="h-3 w-3" />
                      <span className="hidden sm:inline">Settings</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-[10px]">
                    Storage Settings
                  </TooltipContent>
                </Tooltip>

                <Button
                  size="sm"
                  onClick={() => setOnOpen(1)}
                  className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-3 w-3" />
                  <span className="hidden xs:inline">Add</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Storage grid */}
          <div className="flex-1 overflow-auto p-3">
            {isFetching && allStorages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <p className="text-[10px] text-gray-500">
                  Loading storage locations...
                </p>
              </div>
            ) : allStorages.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 auto-rows-fr">
                {allStorages.map((item) => (
                  <StorageItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[260px] text-center px-4">
                <div className="w-10 h-10 mb-2 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-gray-300" />
                </div>
                <h3 className="text-xs font-semibold text-gray-700">
                  No Storage Locations
                </h3>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[260px]">
                  Create your first storage location to start managing
                  medicines.
                </p>
                <Button
                  onClick={() => setOnOpen(1)}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] gap-1.5 mt-3"
                >
                  <Plus className="h-3 w-3" />
                  Add Storage Location
                </Button>
              </div>
            )}
          </div>

          {/* Overview / dashboard */}
          <MedicineDashboard
            token={auth.token as string}
            lineId={lineId as string}
          />
        </div>

        {/* ── Side panel: notifications ─────────────────────────────── */}
        <div
          className={`flex-shrink-0 border-l bg-white flex flex-col transition-all duration-200 ${
            medSideBar.onOpen ? "w-72" : "w-9"
          }`}
        >
          <div className="border-b px-2 py-1.5 flex items-center justify-between gap-1.5 flex-shrink-0">
            {medSideBar.onOpen ? (
              <>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Bell className="h-3 w-3 text-blue-500" />
                  <span className="text-[11px] font-semibold text-gray-800">
                    Notifications
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => medSideBar.setOnOpen()}
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => medSideBar.setOnOpen()}
                variant="ghost"
                className="h-6 w-6 p-0 mx-auto"
                title="Open notifications"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            )}
          </div>

          {medSideBar.onOpen ? (
            <div className="flex-1 min-h-0 overflow-hidden p-2">
              <Notification lineId={lineId} token={auth.token} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center gap-3 py-3">
              <Bell className="h-3.5 w-3.5 text-gray-400" />
            </div>
          )}
        </div>

        {/* Search Modal — any medicine-module user can look up a medicine's
            stock & storages; editing stays gated by Dispense & Stock Access. */}
        <Modal
          title="Search Medicine"
          onOpen={onOpen === 2}
          className="max-w-2xl mx-3 sm:mx-auto"
          setOnOpen={() => setOnOpen(0)}
          cancelTitle="Close"
        >
          {onOpen === 2 && (
            <MedicineSearch
              token={auth.token as string}
              lineId={lineId as string}
              onClose={() => setOnOpen(0)}
            />
          )}
        </Modal>

        {/* Add Storage Modal */}
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
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="p-1.5 bg-blue-600 rounded-md">
                <Package className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-xs">
                  New Storage Location
                </h3>
                <p className="text-[10px] text-gray-500">
                  Create a new storage area for medicines
                </p>
              </div>
            </div>

            <Form {...form}>
              <div className="space-y-3">
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        Storage Name *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Main Pharmacy"
                          disabled={isSubmitting}
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        A clear, descriptive name
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  name="desc"
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        Description
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[70px] resize-y text-xs"
                          disabled={isSubmitting}
                          placeholder="Describe the storage location..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Optional additional information
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] font-semibold text-gray-700">
                        Assigned Unit / Department
                      </FormLabel>
                      <FormControl>
                        <div className="border rounded-md p-1.5 bg-gray-50">
                          <SelectUnit
                            onChange={field.onChange}
                            lineId={lineId as string}
                            auth={auth}
                            currentValue={field.value}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Select the department responsible
                      </FormDescription>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <div className="rounded-md bg-blue-50 p-2 border border-blue-100">
                  <div className="flex gap-1.5">
                    <AlertCircle className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[10px] font-medium text-blue-900">
                        About Storage Locations
                      </p>
                      <p className="text-[10px] text-blue-700 mt-0.5">
                        Storage locations help organize medicines by area. Each
                        location tracks its own inventory and stock movements.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    </TooltipProvider>
  );
};

export default StorageList;
