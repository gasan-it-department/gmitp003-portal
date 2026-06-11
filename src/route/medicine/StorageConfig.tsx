import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import hotkeys from "hotkeys-js";

import { useAuth } from "@/provider/ProtectedRoute";
import { medicineList } from "@/db/statement";
import axios from "@/db/axios";

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { KbdGroup, Kbd } from "@/components/ui/kbd";
import Modal from "@/components/custom/Modal";
import UploadMedicineExcel from "@/layout/medicine/UploadMedicineExcel";
import MedicinItem from "@/layout/medicine/item/MedicinItem";

import {
  ArrowLeft,
  Pencil,
  Plus,
  Package,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

import type { Medicine, AddNewMedicineProps } from "@/interface/data";
import { AddNewMedicineSchema } from "@/interface/zod";

interface ListProps {
  list: Medicine[];
  lastCursor: string | null;
  hasMore: boolean;
}

const StorageConfig = () => {
  const { lineId } = useParams();
  const nav = useNavigate();
  const [onOpen, setOnOpen] = useState(0);
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 500);

  const auth = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isFetching,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    isError,
  } = useInfiniteQuery<ListProps, Error>({
    queryKey: ["medicine-list", lineId, query],
    queryFn: ({ pageParam }) =>
      medicineList(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!auth.token && !!lineId,
    refetchOnWindowFocus: false,
  });

  const form = useForm<AddNewMedicineProps>({
    resolver: zodResolver(AddNewMedicineSchema),
    defaultValues: { name: "", desc: "" },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
  } = form;

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  hotkeys("ctrl+a", (e) => {
    e.preventDefault();
    setOnOpen((o) => (o === 1 ? 0 : 1));
  });
  hotkeys("ctrl+u", (e) => {
    e.preventDefault();
    setOnOpen((o) => (o === 2 ? 0 : 2));
  });

  const onSubmit = async (data: AddNewMedicineProps) => {
    try {
      const response = await axios.post(
        "/add-medicine",
        { name: data.name, desc: data.desc, userId: auth.userId, lineId },
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
        return toast.error("Failed to add medicine");
      }
      await queryClient.invalidateQueries({
        queryKey: ["medicine-list", lineId],
        refetchType: "active",
      });
      reset();
      toast.success("Medicine added");
      setOnOpen(0);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Failed to add medicine"),
      );
    }
  };

  const items = data?.pages.flatMap((p) => p.list) ?? [];

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => nav(-1)}
            >
              <ArrowLeft className="h-3 w-3" />
            </Button>
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Medicine Catalog
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                Manage the master list of medicines
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono flex-shrink-0">
            {items.length} medicines
          </Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <InputGroup className="bg-white flex-1 max-w-xs">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by name or serial..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>

        <div className="ml-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-3 w-3" />
                Add Medicine
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60 p-2" align="end">
              <div className="space-y-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full justify-between h-7 text-[10px]"
                  onClick={() => setOnOpen(1)}
                >
                  <span className="flex items-center gap-1.5">
                    <Pencil className="h-3 w-3" />
                    Add manually
                  </span>
                  <KbdGroup>
                    <Kbd className="text-[9px]">Ctrl</Kbd>
                    <Kbd className="text-[9px]">A</Kbd>
                  </KbdGroup>
                </Button>
                <UploadMedicineExcel
                  token={auth.token as string}
                  lineId={lineId as string}
                  userId={auth.userId as string}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 pt-2 border-t text-center">
                Tip: keyboard shortcuts speed this up
              </p>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[120px]">
                  Serial #
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[200px]">
                  Medicine
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                  Batches
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-28">
                  On-hand
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-right w-32">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">
                        Failed to load catalog
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isFetching && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        No medicines found
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[260px]">
                        {query
                          ? "Try a different search term."
                          : "Add your first medicine to start tracking stock."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] gap-1.5 mt-1"
                        onClick={() => setOnOpen(1)}
                      >
                        <Plus className="h-3 w-3" />
                        Add Medicine
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <MedicinItem
                    key={item.id}
                    item={item}
                    no={i + 1}
                    lineId={lineId as string}
                    auth={auth}
                  />
                ))
              )}

              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={6} className="text-center py-2">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading more...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}

              {!hasNextPage && items.length > 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-2 border-t">
                    <span className="text-[10px] text-gray-400">
                      Showing all {items.length} medicine
                      {items.length !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Medicine Modal */}
      <Modal
        title="Add New Medicine"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          if (isSubmitting) return;
          reset();
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Add Medicine"
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      >
        <Form {...form}>
          <div className="space-y-3">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Medicine Name *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Paracetamol 500mg"
                      disabled={isSubmitting}
                      className="h-8 text-xs"
                    />
                  </FormControl>
                  <FormDescription className="text-[10px]">
                    Spell carefully — the serial number is generated from this.
                  </FormDescription>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="desc"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-semibold text-gray-700">
                    Description (optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Dosage, usage, or other details"
                      disabled={isSubmitting}
                      className="min-h-[70px] text-xs resize-y"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            <p className="text-[10px] text-gray-400 pt-1 border-t">
              Press <Kbd className="text-[9px]">Ctrl</Kbd>+
              <Kbd className="text-[9px]">A</Kbd> to open this dialog.
            </p>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StorageConfig;
