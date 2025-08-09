import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useUser } from "@/provider/UserProvider";
import { useNavigate, useParams, useLocation } from "react-router";
import { useState } from "react";
//statements
import { getContainer } from "@/db/statement";

//interface
import {
  type CreateNewInventory,
  type InventoryBoxProps,
} from "@/interface/data";
import { formatDate } from "@/utils/date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PackagePlus } from "lucide-react";

//
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import { CreateInventoryBoxSchema } from "@/interface/zod";

import axios from "@/db/axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
const ContainterList = () => {
  const auth = useAuth();
  const nav = useNavigate();
  const user = useUser();

  const [onOpen, setOnOpen] = useState(0);
  const { lineId } = useParams();

  const { data, isFetchingNextPage, isFetching } = useInfiniteQuery<{
    list: InventoryBoxProps[];
    lastCursor: string | null;
    hasMore: boolean;
  }>({
    queryFn: ({ pageParam }) =>
      getContainer(
        auth.token as string,
        pageParam as string | null,
        "20",
        "",
        user.user?.departmentId as string,
        user.user?.id
      ),
    queryKey: ["container", user.user?.id],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  const handeViewContainer = (id: string) => {
    try {
      nav(`/${lineId}/supplies/container/${id}`);
      console.log("dasd");
    } catch (error) {
      console.log(error);
    }
  };

  const queryClient = useQueryClient();

  const form = useForm<CreateNewInventory>({
    resolver: zodResolver(CreateInventoryBoxSchema),
  });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, errors },
    setValue,
  } = form;

  const onSubmit = async (data: CreateNewInventory) => {
    try {
      if (!user.user) {
        toast.error("User's data not found");
        return;
      }
      const response = await axios.post(
        "/create-inventory",
        {
          name: data.name,
          lineId: user.user.lineId,
          departmentId: user.user.departmentId,
          userId: user.user.id,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );

      if (response.status !== 200) {
        console.log(response.data.message);

        setError("name", { message: response.data.message });
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["container", user.user.id],
      });
      setValue("name", "");
      setOnOpen(0);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className=" w-full">
      <div className=" w-full p-2 flex justify-end items-center gap-2">
        <Input className=" w-full lg:w-1/3" placeholder=" Search Box" />
        <Button size="sm" onClick={() => setOnOpen(1)}>
          <PackagePlus />
          Create
        </Button>
      </div>
      <div className=" w-full grid grid-cols-4 gap-2 lg:px-12">
        {data &&
          data.pages
            .flatMap((item) => item.list)
            .map((item) => (
              <div
                onClick={() => handeViewContainer(item.id)}
                key={item.id}
                className=" border bg-white rounded p-2 cursor-pointer hover:border-neutral-500 "
              >
                <p className=" text-sm font-medium text-neutral-800 truncate">
                  {item.name}
                </p>
                <p className=" text-sm font">30 Items</p>
                <p className=" text-xs font-light">
                  {formatDate(item.createdAt)}
                </p>
                <p className="  text-xs font-medium text-right text-neutral-900">
                  {item.code}
                </p>
              </div>
            ))}
      </div>

      <Modal
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
        footer={true}
        title={"Create Container"}
        children={
          <div className=" w-full">
            <Form {...form}>
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Type the container title"
                        {...field}
                      />
                    </FormControl>
                    {errors.name && (
                      <FormMessage>{errors.name.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className={" min-w-1/3"}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        yesTitle="Save"
      />
    </div>
  );
};

export default ContainterList;
