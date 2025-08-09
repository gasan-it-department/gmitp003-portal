import { useParams } from "react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/provider/ProtectedRoute";
import { useMutation } from "@tanstack/react-query";
import axios from "@/db/axios";

import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DataSetList from "./DataSetList";
//
import { FolderPlus } from "lucide-react";

//
import { type AddNewDataSetProps } from "@/interface/data";
import { AddNewDataSchema } from "@/interface/zod";

//
import { handleExportDataSetSupplies } from "@/db/statement";

const DataSetConfig = () => {
  const { lineId, containerId, dataSetId } = useParams();
  const [onOpen, setOnOpen] = useState(0);

  const form = useForm<AddNewDataSetProps>({
    resolver: zodResolver(AddNewDataSchema),
  });

  const {
    formState: { isSubmitting, errors },
    handleSubmit,
    setError,
    setValue,
  } = form;

  const auth = useAuth();
  const queryClient = useQueryClient();
  const onSubmit = async (data: AddNewDataSetProps) => {
    try {
      const response = await axios.post(
        "/create-data-set",
        {
          title: data.title,
          lineId,
          inventoryBoxId: containerId,
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
        throw new Error(`${response.data.error}`);
      }
      await queryClient.invalidateQueries({
        queryKey: ["data-set-list", containerId],
        refetchType: "active",
      });
      setValue("title", "");
      setOnOpen(0);
    } catch (error) {
      setError("title", { message: `${error}` });
      console.log(error);
    }
  };

  return (
    <div className=" w-full h-full">
      <div className=" w-full flex justify-end py-2">
        <Button size="sm" onClick={() => setOnOpen(1)}>
          <FolderPlus />
          New
        </Button>
      </div>
      <DataSetList />
      <Modal
        footer={true}
        title={"New Data Set"}
        children={
          <div>
            <Form {...form}>
              <FormField
                name="title"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Data Set Title" {...field} />
                    </FormControl>
                    {errors.title && (
                      <FormMessage>{errors.title.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              <FormDescription>
                The Data Sets are only available on current Container
              </FormDescription>
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => {
          if (isSubmitting) return;
          setValue("title", "");
          setOnOpen(0);
        }}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      />
    </div>
  );
};

export default DataSetConfig;
