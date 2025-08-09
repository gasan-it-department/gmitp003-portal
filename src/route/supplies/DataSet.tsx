import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getDataSetData, handleExportDataSetSupplies } from "@/db/statement";
import { useForm } from "react-hook-form";
import { useAuth } from "@/provider/ProtectedRoute";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";
import hotkeys from "hotkeys-js";

import {
  type SuppliesDataSetProps,
  type AddNewSupplyProps,
} from "@/interface/data";
import { AddNewSupplySchema } from "@/interface/zod";

//
import { Button } from "@/components/ui/button";
import DataSetSupplies from "@/layout/supplies/DataSetSupplies";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import { Checkbox } from "@/components/ui/checkbox";

//icons
import {
  EllipsisVertical,
  SquarePlus,
  CloudUpload,
  CopyCheck,
  Trash,
  ArrowLeftRight,
  Sheet,
} from "lucide-react";
import { Input } from "@/components/ui/input";
const DataSet = () => {
  const [onOpen, setOnOpen] = useState(0);
  const [onSelect, setOnSelect] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const auth = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<AddNewSupplyProps>({
    resolver: zodResolver(AddNewSupplySchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
    setValue,
    control,
  } = form;

  const { dataSetId, lineId } = useParams();
  const { data, isFetching } = useQuery<{
    data: SuppliesDataSetProps;
  }>({
    queryFn: () => getDataSetData(auth.token as string, dataSetId as string),
    queryKey: ["dataSetData", dataSetId],
    enabled: !!dataSetId,
  });

  const handleSubmitFile = async () => {
    if (!file) return;

    // Create new FormData instance
    const formData = new FormData();
    formData.append("file", file, file.name); // Important: Include filename

    try {
      const response = await axios.post("/add-supply-excel", formData, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          // NO Content-Type header here!
        },
        transformRequest: (data) => data, // Bypass Axios transformation
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });
      return response.data;
    } catch (error) {
      console.error("Full error:", `${error}`);
      throw error;
    }
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: handleSubmitFile,
    onError: (err) => {
      console.log(err);
    },
  });

  const onSubmit = async (data: AddNewSupplyProps) => {
    try {
      const response = await axios.post("/add-supply", {
        item: data.name,
        suppliesDataSetId: dataSetId,
        lineId: lineId,
        description: data.desc,
        consumable: data.comsumable,
      });

      if (response.status !== 200) {
        setError("root", { message: "Failed to add" });
        return;
      }
      await queryClient.invalidateQueries({
        queryKey: ["dataSetSupplies", dataSetId],
        refetchType: "active",
      });
      setValue("name", "");
      setValue("desc", "");
      setOnOpen(0);
    } catch (error) {
      console.log(error);
    }
  };

  hotkeys("ctrl+a", function (event) {
    event.preventDefault();
    setOnOpen(1);
  });

  const exportExcel = useMutation({
    mutationFn: () =>
      handleExportDataSetSupplies(
        dataSetId as string,
        auth.token as string,
        `${data?.data.title}-Items`
      ),
    onError: (err) => {
      console.log(err);
    },
  });

  if (!data) {
    return (
      <div className=" w-full h-full">
        <div>NO data Found!</div>
      </div>
    );
  }

  return (
    <div className=" w-full h-full">
      <div className=" w-full p-2 border flex items-center justify-between bg-white">
        <p>{data.data.title}</p>
        <div className=" w-auto flex gap-2">
          {selected.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                <ArrowLeftRight />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setOnSelect(!onSelect)}
              >
                <Trash />
              </Button>
            </div>
          )}
          <Popover>
            <PopoverTrigger>
              <Button size="sm" variant="outline">
                <EllipsisVertical />
              </Button>
            </PopoverTrigger>
            <PopoverContent className=" flex flex-col gap-2">
              <div className="flex flex-col gap-2 p-1 border bg-neutral-100">
                <p className="text-sm font-medium">Add Item</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOnOpen(1)}
                >
                  <SquarePlus />
                  Manual
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOnOpen(2)}
                >
                  <CloudUpload />
                  Upload Excel
                </Button>
              </div>

              <div className="flex flex-col gap-2 p-1 border bg-neutral-100">
                <p className="text-sm font-medium">Export as</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportExcel.mutateAsync()}
                >
                  <Sheet />
                  Excel
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOnSelect(!onSelect)}
              >
                <CopyCheck />
                Select
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <DataSetSupplies
        onSelect={onSelect}
        selected={selected}
        setSelected={setSelected}
      />
      <Modal
        title={"Add New Item"}
        footer={true}
        children={
          <Form {...form}>
            <FormField
              name="name"
              control={control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Name of Item" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              name="desc"
              control={control}
              render={({ field }) => (
                <FormItem className=" mt-2">
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Description of Item" />
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
                <FormItem className="mt-2 flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="consumable"
                      checked={field.value}
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
        }
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />

      <Modal
        title={""}
        footer={true}
        children={
          <div>
            <Input
              type="file"
              placeholder="Select File"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        }
        onOpen={onOpen === 2}
        className={""}
        onFunction={() => mutateAsync()}
        setOnOpen={() => {
          if (isPending) return;
          setOnOpen(0);
        }}
      />
    </div>
  );
};

export default DataSet;
