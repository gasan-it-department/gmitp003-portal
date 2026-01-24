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
import { FolderPlus, Database, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="w-full h-full flex flex-col bg-gray-50/30">
      {/* Header Section */}
      <div className="p-6 border-b bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Data Set Configuration
              </h1>
              <p className="text-sm text-gray-500">
                Manage data structures and fields for your container
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            Container: {containerId?.slice(-8)}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Data sets define the structure and fields for items in this
              container. Create custom data sets to organize your inventory
              effectively.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setOnOpen(1)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <FolderPlus className="h-4 w-4" />
            New Data Set
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Data Sets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataSetList />
          </CardContent>
        </Card>
      </div>

      {/* New Data Set Modal */}
      <Modal
        footer={true}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-lg font-semibold">New Data Set</span>
          </div>
        }
        children={
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Container: {containerId?.slice(-8)}
                  </p>
                  <p className="text-xs text-blue-600">
                    This data set will only be available in the current
                    container
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <FormField
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Data Set Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Equipment Details, Product Specifications, Employee Records"
                        {...field}
                        className="bg-gray-50"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    {errors.title && (
                      <FormMessage>{errors.title.message}</FormMessage>
                    )}
                    <FormDescription className="text-xs mt-2">
                      Give your data set a clear, descriptive name that
                      represents the type of data it will contain.
                    </FormDescription>
                  </FormItem>
                )}
              />
            </Form>

            <Separator />

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                What are Data Sets?
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                  Define custom fields and data structure for your items
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                  Can include fields like: Serial Number, Manufacturer, Expiry
                  Date
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                  Specific to this container only
                </li>
              </ul>
            </div>
          </div>
        }
        onOpen={onOpen === 1}
        className="max-w-lg"
        setOnOpen={() => {
          if (isSubmitting) return;
          setValue("title", "");
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
