import { useParams } from "react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/provider/ProtectedRoute";
import axios from "@/db/axios";

import { Button } from "@/components/ui/button";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import DataSetList from "./DataSetList";
//
import { Database, FileText, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

//
import { type AddNewDataSetProps } from "@/interface/data";
import { AddNewDataSchema } from "@/interface/zod";

//

const DataSetConfig = () => {
  const { lineId, containerId } = useParams();
  const [onOpen, setOnOpen] = useState(0);

  const form = useForm<AddNewDataSetProps>({
    resolver: zodResolver(AddNewDataSchema),
  });

  const {
    formState: { isSubmitting, errors },
    handleSubmit,
    setError,
    reset,
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
          userId: auth.userId,
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
        throw new Error(`${response.data.error}`);
      }
      await queryClient.invalidateQueries({
        queryKey: ["data-set-list", containerId],
        refetchType: "active",
      });
      reset();
      setOnOpen(0);
    } catch (error) {
      setError("title", { message: `${error}` });
      console.log(error);
    }
  };

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Compact */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">
                  Data Set Configuration
                </h1>
                <p className="text-xs text-gray-500">
                  Manage data structures for your container
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5">
              Cont: {containerId?.slice(-8)}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-600 flex-1">
              Data sets define the structure for items in this container.
            </p>
            <Button
              size="sm"
              onClick={() => setOnOpen(1)}
              className="gap-1.5 h-7 text-xs bg-gradient-to-r from-blue-600 to-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New Data Set
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area - Compact */}
      <div className="p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              <h2 className="text-xs font-semibold text-gray-800">Data Sets</h2>
            </div>
          </div>
          <DataSetList />
        </div>
      </div>

      {/* New Data Set Modal - Compact */}
      <Modal
        footer={true}
        title={
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md">
              <Database className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">New Data Set</span>
          </div>
        }
        children={
          <div className="space-y-3 p-1">
            <div className="p-2 bg-blue-50 rounded-md border">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-blue-800">
                    Container: {containerId?.slice(-8)}
                  </p>
                  <p className="text-[10px] text-blue-600">
                    Available only in current container
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <FormField
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">
                      Data Set Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Equipment Details"
                        {...field}
                        className="h-8 text-sm"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    {errors.title && (
                      <FormMessage className="text-[10px]">
                        {errors.title.message}
                      </FormMessage>
                    )}
                    <FormDescription className="text-[10px] mt-1">
                      Give your data set a clear, descriptive name.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </Form>

            <Separator className="my-1" />

            <div className="rounded-md bg-gray-50 p-2">
              <p className="text-[10px] font-medium text-gray-700 mb-1">
                What are Data Sets?
              </p>
              <ul className="text-[10px] text-gray-600 space-y-0.5">
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500">•</span>
                  Define custom fields for your items
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-blue-500">•</span>
                  Specific to this container only
                </li>
              </ul>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-md w-[90vw]"
        setOnOpen={() => {
          if (isSubmitting) return;
          reset();
          setOnOpen(0);
        }}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
        yesTitle="Create Data Set"
      />
    </div>
  );
};

export default DataSetConfig;
