import { useEffect, useState } from "react";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
//
import hotkeys from "hotkeys-js";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//
import { medicineList } from "@/db/statement";
//
import {
  Table,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import MedicinItem from "@/layout/medicine/item/MedicinItem";
import SWWItem from "@/layout/item/SWWItem";
import UploadMedicineExcel from "@/layout/medicine/UploadMedicineExcel";
import Modal from "@/components/custom/Modal";
import { KbdGroup, Kbd } from "@/components/ui/kbd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
//
import { Pencil, Plus, Package, Search, Loader2 } from "lucide-react";

//
import type { Medicine, AddNewMedicineProps } from "@/interface/data";
import { AddNewMedicineSchema } from "@/interface/zod";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

//
interface ListProps {
  list: Medicine[];
  lastCursor: string | null;
  hasMore: boolean;
}

const StorageConfig = () => {
  const { lineId } = useParams();
  const [onOpen, setOnOpen] = useState(0);
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);

  const auth = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isFetching,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery<ListProps, Error>({
    queryKey: ["medicine-list", lineId],
    queryFn: ({ pageParam }) =>
      medicineList(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "10",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  const form = useForm<AddNewMedicineProps>({
    resolver: zodResolver(AddNewMedicineSchema),
    defaultValues: {
      name: "",
      desc: "",
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    resetField,
  } = form;

  const { ref, inView } = useInView({
    threshold: 0,
  });

  hotkeys("ctrl+a", (event) => {
    event.preventDefault();
    if (onOpen === 1) {
      return setOnOpen(0);
    }
    setOnOpen(1);
  });

  hotkeys("ctrl+u", (event) => {
    event.preventDefault();
    if (onOpen === 2) {
      return setOnOpen(0);
    }
    setOnOpen(2);
  });

  const onSubmit = async (data: AddNewMedicineProps) => {
    try {
      const response = await axios.post(
        "/add-medicine",
        {
          name: data.name,
          desc: data.desc,
          userId: auth.userId,
          lineId,
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
        return toast("Failed to add", {
          closeButton: false,
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ["medicine-list", lineId],
        refetchType: "active",
      });
      resetField("desc");
      resetField("name");
      toast.success("Successfully added.", {
        closeButton: false,
      });
      setOnOpen(0);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage().catch((error) => {
        console.error("Error fetching next page:", error);
        toast.error("Failed to load more items");
      });
    }
  }, [inView, hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  useEffect(() => {
    refetch();
  }, [query]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50/30">
      {/* Header Section */}
      <div className="p-6 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Medicine Catalog
              </h1>
              <p className="text-sm text-gray-500">
                Manage your medicine inventory and catalog
              </p>
            </div>
          </div>

          <Badge variant="outline" className="text-sm">
            {totalCount} medicines
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                onChange={(e) => setText(e.target.value)}
                placeholder="Search medicines..."
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Add Medicine
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-between h-10"
                    onClick={() => setOnOpen(1)}
                  >
                    <div className="flex items-center gap-2">
                      <Pencil className="h-4 w-4" />
                      <span>Add Manually</span>
                    </div>
                    <KbdGroup>
                      <Kbd>Ctrl</Kbd>
                      <span>+</span>
                      <Kbd>A</Kbd>
                    </KbdGroup>
                  </Button>

                  <UploadMedicineExcel
                    token={auth.token as string}
                    lineId={lineId as string}
                  />
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Use keyboard shortcuts for faster access
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Medicine List
              </CardTitle>
              {isFetching && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading...</span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-20 text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                      No.
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider border-r">
                      Serial Number
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Medicine Name
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isFetching && !data ? (
                    // Loading skeleton
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="border-r">
                          <Skeleton className="h-4 w-6" />
                        </TableCell>
                        <TableCell className="border-r">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48" />
                        </TableCell>
                        <TableCell className="border-l">
                          <Skeleton className="h-8 w-16" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : allMedicines.length > 0 ? (
                    allMedicines.map((item, i) => (
                      <MedicinItem
                        lineId={lineId as string}
                        auth={auth}
                        key={item.id}
                        item={item}
                        no={i + 1}
                      />
                    ))
                  ) : !isFetching ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="p-3 bg-gray-100 rounded-full mb-3">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-700 mb-2">
                            No medicines found
                          </h3>
                          <p className="text-sm text-gray-500 max-w-sm">
                            Get started by adding your first medicine using the
                            "Add Medicine" button.
                          </p>
                          <Button
                            variant="outline"
                            className="mt-4 gap-2"
                            onClick={() => setOnOpen(1)}
                          >
                            <Plus className="h-4 w-4" />
                            Add First Medicine
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <SWWItem colSpan={3} />
                  )}

                  {/* Infinite scroll trigger */}
                  <TableRow ref={ref}>
                    <TableCell colSpan={4} className="py-6 border-t">
                      <div className="text-center">
                        {isFetchingNextPage ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-gray-600">
                              Loading more items...
                            </span>
                          </div>
                        ) : !hasNextPage && totalCount > 0 ? (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              All {totalCount} medicines loaded
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <ScrollBar />
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Add Medicine Modal */}
      <Modal
        title="Add New Medicine"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          if (isSubmitting) return;
          resetField("desc");
          resetField("name");
          setOnOpen(0);
        }}
        footer={true}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      >
        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Medicine Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter medicine name"
                      disabled={isSubmitting}
                      className="bg-gray-50"
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="text-xs mt-1">
                    Please ensure accurate spelling to avoid future issues.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Additional information about the medicine"
                      disabled={isSubmitting}
                      className="bg-gray-50 resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription className="text-xs">
                    Include dosage, usage instructions, or other relevant
                    details.
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500">
                Press <Kbd>Ctrl</Kbd> + <Kbd>A</Kbd> to quickly open this form.
              </p>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StorageConfig;
