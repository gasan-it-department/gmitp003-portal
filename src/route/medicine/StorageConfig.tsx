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
import Modal from "@/components/custom/Modal";
import { KbdGroup, Kbd } from "@/components/ui/kbd";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
//
import {
  Pencil,
  Plus,
  Square,
  SquareCheckBig,
  Package,
  Upload,
  FileSpreadsheet,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

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
  const [onMultiSelect, setOnMultiSelect] = useState(false);
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 1000);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(Date.now());

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
        query
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
        }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      // You can add file validation here if needed
      const allowedTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload Excel or CSV file.");
        setExcelFile(null);
        setFileKey(Date.now()); // Reset file input
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size too large. Maximum size is 10MB.");
        setExcelFile(null);
        setFileKey(Date.now()); // Reset file input
        return;
      }

      toast.success(`File selected: ${file.name}`);
    }
  };

  // Add this function to trigger file input click
  const triggerFileInput = () => {
    document.getElementById("excel-file-input")?.click();
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
            <Button
              variant={onMultiSelect ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() => setOnMultiSelect(!onMultiSelect)}
            >
              {onMultiSelect ? (
                <SquareCheckBig className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {onMultiSelect ? "Selecting..." : "Multi-select"}
            </Button>

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

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-between h-10"
                    onClick={() => setOnOpen(2)}
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Upload Excel</span>
                    </div>
                    <KbdGroup>
                      <Kbd>Ctrl</Kbd>
                      <span>+</span>
                      <Kbd>U</Kbd>
                    </KbdGroup>
                  </Button>
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
                    {onMultiSelect && (
                      <TableHead className="w-16 border-r">
                        <div className="flex items-center gap-2">
                          <Checkbox />
                          <span className="text-xs text-gray-600">Select</span>
                        </div>
                      </TableHead>
                    )}
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
                        {onMultiSelect && (
                          <TableCell className="border-r">
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                        )}
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
                        onMultiSelect={onMultiSelect}
                      />
                    ))
                  ) : !isFetching ? (
                    <TableRow>
                      <TableCell
                        colSpan={onMultiSelect ? 5 : 4}
                        className="h-64 text-center"
                      >
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
                    <TableCell
                      colSpan={onMultiSelect ? 5 : 4}
                      className="py-6 border-t"
                    >
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

      {/* Excel Upload Modal */}
      {/* Excel Upload Modal */}
      <Modal
        title="Upload Excel File"
        onOpen={onOpen === 2}
        className="max-w-2xl overflow-auto"
        setOnOpen={() => {
          setExcelFile(null);
          setFileKey(Date.now());
          setOnOpen(0);
        }}
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <div className="p-3 bg-blue-50 rounded-full inline-flex mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Upload Medicine Spreadsheet
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Upload an Excel file (.xlsx, .xls, .csv) with your medicine data
            </p>

            {/* Hidden file input */}
            <input
              key={fileKey}
              id="excel-file-input"
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Button to trigger file input */}
            <Button
              variant="outline"
              className="gap-2"
              onClick={triggerFileInput}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Select Excel File
            </Button>

            {/* Show selected file */}
            {excelFile && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm text-green-800">
                        {excelFile.name}
                      </p>
                      <p className="text-xs text-green-600">
                        {(excelFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExcelFile(null);
                      setFileKey(Date.now());
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 mt-6">
              Supported formats: .xlsx, .xls, .csv (Max 10MB)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-blue-800 mb-1">
                  File Requirements
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>
                    • File must include columns: Name, Description (optional)
                  </li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• First row should contain column headers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Upload Button - Only show when file is selected */}
          {excelFile && (
            <div className="pt-4 border-t">
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  // Handle the file upload logic here
                  // You can call your API endpoint with the excelFile
                  toast.success(`Uploading ${excelFile.name}...`);
                  // Reset after upload
                  setExcelFile(null);
                  setFileKey(Date.now());
                  setOnOpen(0);
                }}
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>
          )}
        </div>
      </Modal>

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
