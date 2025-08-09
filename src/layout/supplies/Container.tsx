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
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//
import type { InventoryBoxProps, CreateListProps } from "@/interface/data";
import { CreateListSchame } from "@/interface/zod";
//
import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormField,
  FormLabel,
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
} from "lucide-react";
import { toast } from "sonner";
import InventoryList from "./InventoryList";

const Container = () => {
  const [onOpen, setOnOpen] = useState(0);
  const { containerId, lineId } = useParams();
  const { user } = useUser();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const { data, isFetching, error } = useQuery<{ data: InventoryBoxProps }>({
    queryFn: () =>
      getContainerData(token, containerId as string, user?.id as string),
    queryKey: ["container", containerId],
    enabled: !!token,
  });
  console.log({ data });

  const form = useForm<CreateListProps>({
    resolver: zodResolver(CreateListSchame),
  });
  const {
    handleSubmit,
    control,
    setError,
    formState: { isSubmitting, errors },
  } = form;
  console.log(errors);

  const nav = useNavigate();

  //   if (!data) {
  //     return (
  //       <div className=" w-full h-full grid">
  //         <div className="w-1/2 h-2/3 m-auto bg-amber-100 flex flex-col">
  //           <span>No data found!</span>
  //           <span>
  //             Or Current User is not authorized to access this container.
  //           </span>
  //         </div>
  //       </div>
  //     );
  //   }

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
        }
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
    <div className=" w-full h-full">
      <div className="w-full flex items-center justify-end gap-2 p-2 ">
        <Input
          className=" lg:w-1/3 border border-neutral-500"
          placeholder="Search List"
        />
        <Popover>
          <PopoverTrigger>
            <Button size="sm" variant="outline">
              <CircleEllipsis />
              Manage...
            </Button>
          </PopoverTrigger>
          <PopoverContent className=" flex flex-col gap-1">
            <Button size="sm" variant="outline">
              <FolderClock />
              Activity Logs
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                nav(
                  `/${lineId}/supplies/container/${containerId}/data-set-config`
                )
              }
            >
              <FolderCog />
              Data Set Conf.
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                nav(
                  `/${lineId}/supplies/container/${containerId}/accessibility`
                )
              }
            >
              <Key />
              Accessibility
            </Button>
          </PopoverContent>
        </Popover>

        <Button size="sm" onClick={() => setOnOpen(1)}>
          <ScrollText />
          Create List
        </Button>
      </div>
      <InventoryList />
      <Modal
        onFunction={handleSubmit(onSubmit)}
        footer={true}
        yesTitle="Save"
        title={"Create New List"}
        children={
          <div>
            <Form {...form}>
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Title" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
        loading={isSubmitting}
      />
    </div>
  );
};

export default Container;
