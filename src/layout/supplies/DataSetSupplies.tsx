import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { getDataSetDataSupplies } from "@/db/statement";
import { useAuth } from "@/provider/ProtectedRoute";
import { useUser } from "@/provider/UserProvider";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
//tables

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableHeader,
} from "@/components/ui/table";
import type { AddNewSupplyProps, SuppliesProps } from "@/interface/data";
import { formatDate } from "@/utils/date";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuContent,
} from "@/components/ui/context-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Pencil, Trash } from "lucide-react";
import Modal from "@/components/custom/Modal";

//
import { delteSupply } from "@/db/statement";
import { AddNewSupplySchema } from "@/interface/zod";
import axios from "@/db/axios";
import { isEmpty } from "@/utils/route";
//

//props
interface Props {
  onSelect: boolean;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

const DataSetSupplies = ({ onSelect, selected, setSelected }: Props) => {
  const auth = useAuth();
  const user = useUser();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [text] = useDebounce(query, 1000);

  const [selectAll, setSelectAll] = useState(false);
  const [onOpen, setOnOpen] = useState(0);
  const [selectedItem, setSelectedItem] = useState<SuppliesProps | null>(null);

  const { dataSetId, containerId } = useParams();

  const form = useForm({
    resolver: zodResolver(AddNewSupplySchema),
    defaultValues: {
      name: selectedItem ? selectedItem.item : "",
      desc: selectedItem ? (selectedItem.description as string) : "",
      comsumable: selectedItem ? selectedItem.consumable : false,
    },
  });
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    control,
  } = form;

  const onSubmit = async (data: AddNewSupplyProps) => {
    try {
      if (!selectedItem) {
        return toast.error("Invalid required data", {
          closeButton: false,
        });
      }
      const toUpdata: any = {
        id: selectedItem.id,
        consumable: data.comsumable,
      };

      if (
        selectedItem &&
        selectedItem.item.toLowerCase() !== data.name.toLowerCase()
      ) {
        toUpdata.item = data.name;
      }
      if (
        selectedItem &&
        selectedItem.description?.toLowerCase() !== data.desc.toLowerCase()
      ) {
        toUpdata.description = data.desc;
      }
      console.log(toUpdata);

      if (isEmpty(toUpdata)) {
        toast.warning("Invalid Input", {
          description: "Please change something to proceed",
          closeButton: false,
          position: "top-right",
        });
        return;
      }
      const response = await axios.post("/update-supply", toUpdata, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      setOnOpen(0);
      await queryClient.invalidateQueries({
        queryKey: ["dataSetSupplies", dataSetId],
        refetchType: "active",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const { data, isFetching, isFetchingNextPage, refetch } = useInfiniteQuery<{
    list: SuppliesProps[];
    lastCursor: string | null;
    hasMore: boolean;
  }>({
    queryFn: ({ pageParam }) =>
      getDataSetDataSupplies(
        auth.token as string,
        dataSetId as string,
        pageParam as string | null,
        "20",
        text
      ),
    queryKey: ["dataSetSupplies", dataSetId],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
    enabled: !!dataSetId,
  });

  const handleCheck = (id: string) => selected.includes(id);

  // Proper toggle implementation
  const handleAddToList = (id: string) => {
    setSelected(
      (prev) =>
        prev.includes(id)
          ? prev.filter((item) => item !== id) // Remove if exists
          : [...prev, id] // Add if doesn't exist
    );
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      delteSupply(
        auth.token as string,
        selectedItem?.id as string,
        user.user?.id as string,
        containerId as string
      ),
    onError: (err) => {
      toast.error("Failed to delete", {
        closeButton: false,
        description: `${err}`,
        position: "top-right",
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["dataSetSupplies", dataSetId],
        refetchType: "active",
      });
      setOnOpen(0);
      setSelectedItem(null);
    },
  });

  useEffect(() => {
    refetch();
  }, [text]);

  useEffect(() => {
    const main = () => {
      if (selectAll) {
        const ids = data
          ? data.pages.flatMap((item) => item.list).map((item) => item.id)
          : [];
        setSelected(ids);
      } else {
        setSelected([]);
      }
    };
    main();
  }, [selectAll]);

  if (!data) {
    return (
      <div className=" w-full h-full">
        <div>DOidas</div>
      </div>
    );
  }
  return (
    <div className=" w-full">
      <div className="w-full p-2 items-center flex justify-between">
        <p className=" font-medium text-lg">Supplies</p>
        <Input
          className=" lg:w-1/3 bg-white"
          placeholder="Search Item"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Table>
        <TableHeader className=" border bg-neutral-700">
          {onSelect ? (
            <TableHead className=" text-white ">
              <Checkbox
                checked={selectAll}
                onCheckedChange={(checked) => {
                  // Explicitly handle all possible CheckedState values
                  setSelectAll(checked === "indeterminate" ? false : checked);
                }}
              />
              Select all
            </TableHead>
          ) : null}
          <TableHead className=" text-white">No.</TableHead>
          <TableHead className=" text-white">Item name</TableHead>
          <TableHead className=" text-white">Consumable</TableHead>
          <TableHead className=" text-white">Current Stock/s</TableHead>
          <TableHead className=" text-white">Ref. Number</TableHead>
          <TableHead className=" text-white">Date Added</TableHead>
        </TableHeader>
        <TableBody>
          {data.pages ? (
            data.pages.flatMap((item) => item.list).length > 0 ? (
              data.pages
                .flatMap((item) => item.list)
                .map((item, i) => (
                  <ContextMenu>
                    <ContextMenuTrigger asChild={true}>
                      <TableRow
                        onClick={() => {
                          if (!onSelect) return;
                          handleAddToList(item.id);
                        }}
                        key={item.id}
                      >
                        {onSelect ? (
                          <TableCell>
                            <Checkbox checked={handleCheck(item.id)} />
                          </TableCell>
                        ) : null}
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.consumable ? "YES" : "NO"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                      </TableRow>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        onClick={() => {
                          setOnOpen(1);
                          setSelectedItem(item);
                        }}
                      >
                        <Pencil />
                        Update
                      </ContextMenuItem>
                      <ContextMenuItem
                        onClick={() => {
                          setOnOpen(2);
                          setSelectedItem(item);
                        }}
                      >
                        <Trash />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className=" text-center">
                  No Item found!
                </TableCell>
              </TableRow>
            )
          ) : null}
          {isFetching ||
            (isFetchingNextPage && (
              <TableRow>
                <TableCell colSpan={5} className=" text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <Modal
        onFunction={mutateAsync}
        loading={isPending}
        footer={true}
        title={"Delete Item"}
        children={
          <div>
            <p className=" font-medium text-lg text-red-500">
              Are you sure you want to delete this item?
            </p>
            <p className=" text-neutral-700 truncate text-ellipsis">
              Item: {selectedItem?.item ?? "N/A"}
            </p>

            <p className=" mt-2 text-sm text-orange-500">
              Warning: Related to this data might be delete as well or set to
              "N/A"
            </p>
          </div>
        }
        onOpen={onOpen === 2}
        className={""}
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
      />

      <Modal
        loading={isSubmitting}
        onFunction={handleSubmit(onSubmit)}
        footer={true}
        title={"Update Item"}
        children={
          <div>
            <Form {...form}>
              <FormField
                defaultValue={selectedItem?.item}
                name="name"
                render={({ field: { onChange, onBlur } }) => (
                  <FormItem>
                    <FormLabel>Items'name</FormLabel>
                    <FormControl>
                      <Input
                        defaultValue={selectedItem?.item}
                        onChange={onChange}
                        onBlur={onBlur}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                defaultValue={selectedItem?.item}
                name="desc"
                render={({ field: { onChange, onBlur } }) => (
                  <FormItem className=" mt-3">
                    <FormLabel>Descriptions</FormLabel>
                    <FormControl>
                      <Input
                        defaultValue={selectedItem?.description as string}
                        onChange={onChange}
                        onBlur={onBlur}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="comsumable"
                rules={{
                  required: false,
                }}
                control={control} // Add this line
                render={({ field }) => (
                  <FormItem className=" flex items-center space-x-2 space-y-0 mt-2">
                    <FormControl>
                      <Checkbox
                        id="consumable"
                        checked={selectedItem?.consumable || field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel htmlFor="consumable" className="cursor-pointer">
                      Consumable
                    </FormLabel>
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          if (isSubmitting) return;
          setSelectedItem(null);
          setOnOpen(0);
        }}
      />
    </div>
  );
};

export default DataSetSupplies;
