import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { getDataSetDataSupplies } from "@/db/statement";
import { useAuth } from "@/provider/ProtectedRoute";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { useForm } from "react-hook-form";
import { useInView } from "react-intersection-observer";
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
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Pencil,
  Trash2,
  Package,
  Calendar,
  Tag,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

//
import { delteSupply } from "@/db/statement";
import { AddNewSupplySchema } from "@/interface/zod";
import axios from "@/db/axios";
import { isEmpty } from "@/utils/route";
import { searchedChar } from "@/utils/element";
//

//props
interface Props {
  onSelect: boolean;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

const DataSetSupplies = ({ onSelect, selected, setSelected }: Props) => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { inView, ref } = useInView();
  const [query, setQuery] = useState("");
  const [text] = useDebounce(query, 1000);

  const [selectAll, setSelectAll] = useState(false);
  const [onOpen, setOnOpen] = useState(0);
  const [selectedItem, setSelectedItem] = useState<SuppliesProps | null>(null);
  const [popoverOpenId, setPopoverOpenId] = useState<string | null>(null);

  const { dataSetId, containerId } = useParams();

  const form = useForm<AddNewSupplyProps>({
    resolver: zodResolver(AddNewSupplySchema),
    defaultValues: {
      name: "",
      desc: "",
      comsumable: false,
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
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
        selectedItem.description?.toLowerCase() !== data.desc?.toLowerCase()
      ) {
        toUpdata.description = data.desc;
      }

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
      setSelectedItem(null);
      setPopoverOpenId(null);
      await queryClient.invalidateQueries({
        queryKey: ["dataSetSupplies", dataSetId],
        refetchType: "active",
      });
    } catch (error) {
      console.log(error);
    }
  };

  const {
    data,
    isFetching,
    isFetchingNextPage,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<{
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
        text,
      ),
    queryKey: ["dataSetSupplies", dataSetId],
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
    enabled: !!dataSetId,
  });

  const handleAddToList = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      delteSupply(
        auth.token as string,
        selectedItem?.id as string,
        auth.userId as string,
        containerId as string,
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
      setPopoverOpenId(null);
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

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (onOpen === 1 && selectedItem) {
      reset({
        name: selectedItem.item || "",
        desc: (selectedItem.description as string) || "",
        comsumable: selectedItem.consumable || false,
      });
    }
  }, [selectedItem, onOpen, reset]);

  const handleModalClose = () => {
    if (isSubmitting || isPending) return;
    setOnOpen(0);
    setSelectedItem(null);
    setPopoverOpenId(null);
    reset({
      name: "",
      desc: "",
      comsumable: false,
    });
  };

  const handlePopoverOpenChange = (open: boolean, id: string) => {
    setPopoverOpenId(open ? id : null);
  };

  const handleUpdateClick = (item: SuppliesProps) => {
    setSelectedItem(item);
    setOnOpen(1);
    setPopoverOpenId(null);
  };

  const handleDeleteClick = (item: SuppliesProps) => {
    setSelectedItem(item);
    setOnOpen(2);
    setPopoverOpenId(null);
  };

  const allItems = data?.pages.flatMap((page) => page.list) || [];
  const totalItems = allItems.length;
  const hasItems = totalItems > 0;

  if (isFetching && !data) {
    return (
      <div className="w-full h-full p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items ({totalItems})
          </CardTitle>
          {selected.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {selected.length} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-300px)]">
        <Table>
          <TableHeader className="sticky top-0 bg-gray-50 z-10">
            <TableRow className="hover:bg-transparent">
              {onSelect && (
                <TableHead className="w-16 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={(checked) => {
                        setSelectAll(
                          checked === "indeterminate" ? false : checked,
                        );
                      }}
                    />
                    <span className="text-xs">Select</span>
                  </div>
                </TableHead>
              )}
              <TableHead className="w-16 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                No.
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                Item Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                Consumable
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                Reference
              </TableHead>
              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date Added
              </TableHead>
              <TableHead className="w-20 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hasItems ? (
              <>
                {allItems.map((item, i) => (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selected.includes(item.id) ? "bg-blue-50" : ""
                    }`}
                  >
                    {onSelect && (
                      <TableCell className="border-r">
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onCheckedChange={() => handleAddToList(item.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-medium border-r">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-sm">
                        {i + 1}
                      </div>
                    </TableCell>
                    <TableCell className="border-r">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {searchedChar(text, item.item)}
                          </p>
                          {item.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r">
                      {item.consumable ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="border-r">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {item.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Popover
                        open={popoverOpenId === item.id}
                        onOpenChange={(open) =>
                          handlePopoverOpenChange(open, item.id)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                            <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                            <div className="h-1 w-1 rounded-full bg-gray-400"></div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-3" align="end">
                          <div className="space-y-1">
                            <div className="px-2 py-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {item.item}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.code}
                              </p>
                            </div>
                            <Separator />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2"
                              onClick={() => handleUpdateClick(item)}
                            >
                              <Pencil className="h-4 w-4" />
                              Update Item
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteClick(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Item
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Infinite scroll trigger */}
                <TableRow ref={ref}>
                  <TableCell
                    colSpan={onSelect ? 8 : 7}
                    className="border-t h-20"
                  >
                    <div className="text-center py-4">
                      {isFetchingNextPage ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">
                            Loading more items...
                          </span>
                        </div>
                      ) : !hasNextPage && totalItems > 0 ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            All {totalItems} items loaded
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={onSelect ? 8 : 7} className="h-64">
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      {query ? "No items found" : "No items available"}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      {query
                        ? `No items match "${query}". Try a different search term.`
                        : "Add your first item to get started with this data set."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Update Item Modal */}
      <Modal
        loading={isSubmitting}
        onFunction={handleSubmit(onSubmit)}
        footer={true}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Pencil className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold">Update Item</span>
          </div>
        }
        children={
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <Tag className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Current: {selectedItem?.item}
                  </p>
                  <p className="text-xs text-blue-600">
                    Reference: {selectedItem?.code}
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Item Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter item name"
                        className="bg-gray-50"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="desc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter item description"
                        className="bg-gray-50"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="comsumable"
                control={control}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Consumable Item
                      </FormLabel>
                      <p className="text-xs text-gray-500">
                        Check if this item is meant to be consumed or used up
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={handleModalClose}
        yesTitle="Update Item"
      />

      {/* Delete Item Modal */}
      <Modal
        onFunction={() => mutateAsync()}
        loading={isPending}
        footer={true}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-lg font-semibold text-red-800">
              Delete Item
            </span>
          </div>
        }
        children={
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="p-4 bg-red-50 rounded-full mb-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Delete "{selectedItem?.item}"
              </h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to delete this item? This action cannot be
                undone.
              </p>
            </div>

            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <p className="font-medium mb-1">Warning</p>
                <p className="text-sm">
                  Related data (transactions, logs) might be affected or set to
                  default values.
                </p>
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-800">
                    {selectedItem?.item}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {selectedItem?.code}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Created:{" "}
                      {selectedItem && formatDate(selectedItem.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-md"
        setOnOpen={handleModalClose}
        yesTitle="Delete Item"
      />
    </div>
  );
};

export default DataSetSupplies;
