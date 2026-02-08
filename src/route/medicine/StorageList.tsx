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
  FilePlus2,
  Logs,
  ChevronRight,
  Menu,
  Search,
  FileCog,
  HandHelping,
} from "lucide-react";

//interfaces and Props
import type {
  MedicineStorage,
  NewStorageLocationProps,
} from "@/interface/data";
import { NewStorageLocationSchema } from "@/interface/zod";
import StorageItem from "@/layout/medicine/item/StorageItem";
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
  });

  const form = useForm({
    resolver: zodResolver(NewStorageLocationSchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    resetField,
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
      resetField("departmentId");
      resetField("desc");
      resetField("name");
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

  return (
    <div className=" w-full h-full flex">
      <TooltipProvider>
        <div className={` ${medSideBar.onOpen ? "w-3/4" : "w-full"} h-full`}>
          <div className=" w-full h-[10%] p-2 flex justify-between items-center border border-x-0 gap-2 bg-white">
            <div className=" w-auto flex gap-2">
              <Tooltip delayDuration={1000}>
                <TooltipTrigger>
                  <Button size="sm" onClick={() => nav(`precribe-medicine`)}>
                    <HandHelping />
                    {/* <KbdGroup>
                      <Kbd>Ctrl</Kbd>+<Kbd>D</Kbd>
                    </KbdGroup> */}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Dispense</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOnOpen(2)}
                  >
                    <Search />
                    <p className=" font-medium text-neutral-600 text-xs">
                      Search Medicine{" "}
                      <KbdGroup>
                        <Kbd>Ctrl</Kbd>+<Kbd>K</Kbd>
                      </KbdGroup>
                    </p>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search Medicine</TooltipContent>
              </Tooltip>
            </div>

            <div className=" w-auto flex gap-2">
              <Tooltip delayDuration={1000}>
                <TooltipTrigger>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => nav(`logs`)}
                  >
                    <Logs />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Activity Logs</TooltipContent>
              </Tooltip>
              <Tooltip delayDuration={1000}>
                <TooltipTrigger>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => nav(`config`)}
                  >
                    <FileCog />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Setting</TooltipContent>
              </Tooltip>
              <Button size="sm" onClick={() => setOnOpen(1)}>
                <FilePlus2 />
                Add Storage Location
              </Button>
            </div>
          </div>
          <div className="w-full grid grid-cols-4 p-2 gap-2">
            {isFetching ? (
              <div className=" col-span-4 w-full row-span-2 flex justify-center items-center gap-2">
                <Spinner />
                <p className="">Loading...</p>
              </div>
            ) : data ? (
              data.pages.flatMap((item) => item.list).length > 0 ? (
                data.pages
                  .flatMap((item) => item.list)
                  .map((item) => <StorageItem key={item.id} item={item} />)
              ) : (
                <div className=" col-span-4 h-20 ">
                  <p>No Storage found!</p>
                </div>
              )
            ) : (
              <div className=" col-span-4 h-20 ">
                <p>Something went wrong</p>
              </div>
            )}
          </div>
        </div>

        <div
          className={` ${
            medSideBar.onOpen ? "w-1/4" : "w-auto"
          }  h-full border border-t-0 border-l-neutral-400 bg-white`}
        >
          <div className=" w-full h-[10%] p-2 flex justify-end items-center border border-x-0">
            <Button
              size="sm"
              onClick={() => medSideBar.setOnOpen()}
              variant="outline"
              className=""
            >
              {medSideBar.onOpen ? <ChevronRight /> : <Menu />}
            </Button>
          </div>
          <div className=" w-full h-[90%]">
            {medSideBar.onOpen && (
              <Notification lineId={lineId} token={auth.token} />
            )}
          </div>
        </div>
        <Modal
          title={""}
          children={undefined}
          onOpen={onOpen === 2}
          className={" min-w-2xl"}
          setOnOpen={() => setOnOpen(0)}
          cancelTitle="Close"
        />
        <Modal
          title={"Add Storage Location"}
          onOpen={onOpen === 1}
          className={""}
          setOnOpen={() => {
            if (isFetching || isSubmitting) return;
            resetField("departmentId");
            resetField("desc");
            resetField("name");
            setOnOpen(0);
          }}
          footer={true}
          yesTitle="Confirm"
          onFunction={handleSubmit(onSubmit)}
        >
          <div>
            <Form {...form}>
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter the storage label"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="desc"
                control={control}
                render={({ field }) => (
                  <FormItem className=" mt-4">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        className=" max-h-20"
                        disabled={isSubmitting}
                        placeholder="Enter storage additional information"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem className=" mt-4 w-full p-2 border border-neutral-300 rounded">
                    <FormLabel>Unit/Office/Department</FormLabel>
                    <FormControl>
                      <SelectUnit
                        onChange={field.onChange}
                        lineId={lineId as string}
                        auth={auth}
                        currentValue={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        </Modal>
      </TooltipProvider>
    </div>
  );
};

export default StorageList;
