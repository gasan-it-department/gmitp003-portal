import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate } from "react-router";
import { useInView } from "react-intersection-observer";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";

//
import { prescriptionPrescribeMed } from "@/db/statement";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
//
//import { ScrollArea } from "@/components/ui/scroll-area";
import DispensaryMedItem from "./item/DispensaryMedItem";
import { Spinner } from "@/components/ui/spinner";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Modal from "@/components/custom/Modal";
//icons
import { CircleAlert, Send, Undo2, Package } from "lucide-react";

//
import type {
  PrecribeMedicine,
  ReleasePrescribeMedProps,
} from "@/interface/data";
import { ReleasePrescribeMedSchema } from "@/interface/zod";
import { Badge } from "@/components/ui/badge";
import { allMedicineStock } from "@/utils/helper";

interface Props {
  id: string | undefined;
  token: string | undefined;
  userId: string;
  status: number;
}

interface ListProps {
  list: PrecribeMedicine[];
  hasMore: boolean;
  lastCursor: string | undefined;
}

const DispensaryMedicine = ({ token, id, userId, status }: Props) => {
  const [onOpen, setOnOpen] = useState(0);
  const queryClient = useQueryClient();
  const nav = useNavigate();
  const { ref, inView } = useInView();

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<ListProps>({
      queryKey: ["prescribeMeds", id],
      queryFn: ({ pageParam }) =>
        prescriptionPrescribeMed(
          token as string,
          id,
          pageParam as string | null,
          "10",
          "",
        ),
      initialPageParam: null,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      enabled: !!token && !!id,
    });

  const form = useForm<ReleasePrescribeMedProps>({
    resolver: zodResolver(ReleasePrescribeMedSchema),
    defaultValues: {
      prescribeMed: [],
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    reset,
  } = form;

  const prescribeMeds = useFieldArray({
    control,
    name: "prescribeMed",
  });

  // Load more when scroll to bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Update form when data is available
  useEffect(() => {
    if (data && data.pages.length > 0) {
      const formattedData = data.pages
        .flatMap((item) => item.list)
        .map((item) => {
          console.log("ITems: ", item);

          return {
            remark: item.remark,
            quantity: item.quantity.toString(),
            prescribeQuantity: item.quantity.toString(),
            id: item.id,
            medId: item.medicineId,
            stockId: "",
            label: item.medicine?.name || "Unknown Medicine",
            currentStock:
              item.medicine?.MedicineStock.length > 0
                ? allMedicineStock(item.medicine.MedicineStock).toString()
                : "0",
            stocks:
              item.medicine?.MedicineStock.length > 0
                ? item.medicine.MedicineStock.map((item) => ({
                    id: item.id,
                    expireIn: item.expiration as string | undefined,
                    quantity: item.actualStock.toString(),
                    toRelease: "0",
                  }))
                : [],
          };
        });
      console.log({ formattedData });

      reset({
        prescribeMed: formattedData,
      });
    }
  }, [data, reset]);

  const onSubmit = async (data: ReleasePrescribeMedProps) => {
    try {
      const response = await axios.patch("/prescription/dispense", {
        id: id,
        userId: userId,
        prescribeMed: data.prescribeMed.map((item) => {
          return {
            id: item.id,
            medId: item.medId,
            quantity: parseInt(item.quantity, 10),
            remark: item.remark,
            prescribeQuantity: parseInt(item.prescribeQuantity, 10),
            stocks: item.stocks.map((stock) => ({
              id: stock.id,
              toRelease: parseInt(stock.toRelease, 10),
            })),
          };
        }),
      });

      if (response.status !== 200) {
        throw new Error(response.data.message);
      }
      await queryClient.invalidateQueries({
        queryKey: ["prescribeMeds", id],
        refetchType: "active",
      });
      toast.success("Success");
      nav(-1);
    } catch (error) {
      toast.error("Failed to submit", {
        description: `${error}`,
      });
    }
  };

  const allMedicines = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allMedicines.length;

  if (isFetching && allMedicines.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            Loading prescribed medicines...
          </p>
        </div>
      </div>
    );
  }

  if (!data || allMedicines.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-sm mx-4 p-6 bg-white rounded-lg shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <CircleAlert className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No Medicines Found
          </h3>
          <p className="text-sm text-gray-500">
            No prescribed medicines found for this prescription.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header - Compact */}
      <div className="flex-shrink-0 bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Package className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Dispense Medicines
                </h2>
                <p className="text-xs text-gray-500">
                  {totalCount} item{totalCount !== 1 ? "s" : ""} to dispense
                </p>
              </div>
            </div>
            {status === 2 && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                Completed
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-auto">
        <div className="p-3 sm:p-4">
          <TooltipProvider>
            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                <FormField
                  control={control}
                  name="prescribeMed"
                  render={() => <input type="hidden" />}
                />

                {prescribeMeds.fields.length > 0 ? (
                  <div className="space-y-3">
                    {prescribeMeds.fields.map((item, index) => (
                      <DispensaryMedItem
                        key={item.id}
                        id={`prescribeMed.${index}`}
                        control={control}
                        item={item}
                        no={index}
                        status={status}
                      />
                    ))}

                    {/* Infinite scroll trigger */}
                    <div ref={ref} className="flex justify-center py-3">
                      {isFetchingNextPage ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Spinner className="h-4 w-4" />
                          <span className="text-xs">Loading more...</span>
                        </div>
                      ) : hasNextPage ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchNextPage()}
                          className="text-xs h-8"
                        >
                          Load more medicines
                        </Button>
                      ) : (
                        <p className="text-xs text-gray-400">
                          All medicines loaded
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      No prescribed medicines
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      There are no medicines to dispense for this prescription.
                    </p>
                  </div>
                )}
              </form>
            </Form>
          </TooltipProvider>
        </div>
      </div>

      {/* Fixed Footer - Mobile friendly */}
      <div className="flex-shrink-0 bg-white border-t shadow-lg">
        <div className="px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-xs text-gray-500 text-center sm:text-left">
              {totalCount} item{totalCount !== 1 ? "s" : ""} total
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                type="button"
                disabled={isSubmitting || status === 2}
                onClick={() => setOnOpen(2)}
                className="flex-1 sm:flex-none gap-2 h-10 text-sm"
              >
                <Undo2 className="h-4 w-4" />
                Return
              </Button>
              <Button
                type="button"
                disabled={
                  isSubmitting ||
                  status === 2 ||
                  prescribeMeds.fields.length === 0
                }
                onClick={() => setOnOpen(1)}
                className="flex-1 sm:flex-none gap-2 h-10 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Dispensing..." : "Dispense"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dispense Modal */}
      <Modal
        title="Confirm Dispensing"
        children={
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to dispense these medicines? This action
              cannot be undone.
            </p>
            <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
              <p className="text-xs text-amber-800">
                Please verify all quantities and remarks before proceeding.
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md mx-4"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        yesTitle="Confirm Dispense"
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />

      {/* Return to Prescriber Modal */}
      <Modal
        title="Return to Prescriber"
        children={
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to return this prescription to the
              prescriber?
            </p>
            <div className="rounded-md bg-blue-50 p-3 border border-blue-200">
              <p className="text-xs text-blue-800">
                This will mark the prescription as requiring review by the
                prescriber.
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-md mx-4"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        yesTitle="Return to Prescriber"
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />
    </div>
  );
};

export default DispensaryMedicine;
