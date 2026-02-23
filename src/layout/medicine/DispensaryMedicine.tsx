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
import { ScrollArea } from "@/components/ui/scroll-area";
import DispensaryMedItem from "./item/DispensaryMedItem";
import { Spinner } from "@/components/ui/spinner";
import { Form, FormField } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Modal from "@/components/custom/Modal";
//icons
import { CircleAlert, Send, Undo2 } from "lucide-react";

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
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading prescribed medicines...</p>
        </div>
      </div>
    );
  }

  if (!data || allMedicines.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center max-w-sm">
          <CircleAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="font-medium text-red-600 text-lg mb-2">
            Data Not Found
          </p>
          <p className="text-gray-600 text-sm">
            No prescribed medicines found for this prescription.
            <br />
            Please check the prescription details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 mt-1">
              {totalCount} prescribed medicine{totalCount !== 1 ? "s" : ""} to
              dispense
            </p>
          </div>
          {status === 2 && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Completed
            </Badge>
          )}
        </div>
      </div>

      {/* Content Area - Fixed height container */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <TooltipProvider>
              <Form {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={control}
                    name="prescribeMed"
                    render={() => <input type="hidden" />}
                  />

                  {prescribeMeds.fields.length > 0 ? (
                    <div className="space-y-4">
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
                      <div ref={ref} className="flex justify-center py-4">
                        {isFetchingNextPage ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Spinner className="w-4 h-4" />
                            <span className="text-sm">Loading more...</span>
                          </div>
                        ) : hasNextPage ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchNextPage()}
                            className="text-sm"
                          >
                            Load more medicines
                          </Button>
                        ) : (
                          <p className="text-gray-400 text-sm text-center">
                            All medicines loaded
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CircleAlert className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No prescribed medicines</p>
                      <p className="text-sm mt-1">
                        There are no medicines to dispense for this
                        prescription.
                      </p>
                    </div>
                  )}
                </form>
              </Form>
            </TooltipProvider>
          </div>
        </ScrollArea>
      </div>

      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t bg-gray-50 p-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {totalCount} item{totalCount !== 1 ? "s" : ""} total
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              type="button"
              size="lg"
              disabled={isSubmitting || status === 2}
              onClick={() => setOnOpen(2)}
              className="min-w-32"
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Return
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={
                isSubmitting ||
                status === 2 ||
                prescribeMeds.fields.length === 0
              }
              onClick={() => setOnOpen(1)}
              className="min-w-32 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Dispense"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        title="Confirm Dispensing"
        children={
          <div className="w-full">
            <p className="text-gray-600 mb-4">
              Are you sure you want to dispense these medicines? This action
              cannot be undone.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Please verify all quantities and remarks before proceeding.
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="w-sm xl:w-md"
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        yesTitle="Confirm Dispense"
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />

      <Modal
        title="Return to Prescriber"
        children={
          <div className="w-full">
            <p className="text-gray-600 mb-4">
              Are you sure you want to return this prescription to the
              prescriber?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                This will mark the prescription as requiring review by the
                prescriber.
              </p>
            </div>
          </div>
        }
        onOpen={onOpen === 2}
        className="w-sm xl:w-md"
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
