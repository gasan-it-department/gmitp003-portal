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
import { Separator } from "@/components/ui/separator";

//
import { type AddNewDataSetProps } from "@/interface/data";
import { AddNewDataSchema } from "@/interface/zod";
import {
  PageShell,
  Toolbar,
  ToolbarSpacer,
  PageBody,
  Panel,
  PanelBody,
} from "@/components/custom/page";

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
    <PageShell>
      {/*
        The old header spent three stacked rows on one sentence of
        explanation and a truncated container id. The sentence said what a
        data set is, which the empty state is the place for; the id was
        debug output. Both are gone, and the control that was below the
        fold on a short screen is now beside the title.
      */}
      <Toolbar
        icon={Database}
        title="Data Set Configuration"
        subtitle="The structure items in this container are built from"
      >
        <ToolbarSpacer />
        <Button
          size="sm"
          onClick={() => setOnOpen(1)}
          className="gap-1.5 h-8 text-xs shrink-0"
        >
          <Plus className="h-3 w-3" />
          New Data Set
        </Button>
      </Toolbar>

      <PageBody>
        <Panel>
          <div className="px-3 py-2 border-b bg-gray-50 shrink-0">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-blue-500" />
              <h2 className="text-[10px] font-semibold text-gray-700 uppercase">
                Data Sets
              </h2>
            </div>
          </div>
          <PanelBody>
            <DataSetList />
          </PanelBody>
        </Panel>
      </PageBody>

      {/* New Data Set Modal - Compact */}
      <Modal
        footer={true}
        title={
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="text-sm font-semibold">New Data Set</span>
          </div>
        }
        children={
          <div className="space-y-3 p-1">
            <div className="p-2 bg-blue-50 rounded-md border">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-blue-500" />
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
    </PageShell>
  );
};

export default DataSetConfig;
