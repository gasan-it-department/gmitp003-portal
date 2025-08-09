import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import axios from "@/db/axios";

import type { AddUnitProps } from "@/interface/data";
import { AddUnitSchema } from "@/interface/zod";
//
import {
  FormControl,
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
//
interface Props {
  existed: boolean;
  id: string | undefined;
  title: string | undefined;
  description?: string | undefined;
  token: string | undefined;
}

const AddEditUnit = ({ existed, id, title, description, token }: Props) => {
  const queryClient = useQueryClient();
  const form = useForm<AddUnitProps>({
    resolver: zodResolver(AddUnitSchema),
  });
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: AddUnitProps) => {
    try {
      const response = await axios.post(
        "/add-unit",
        {
          line: "",
          title: data.name,
          description: data.description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        }
      );

      if (response.status !== 200) {
      }
      await queryClient.invalidateQueries({
        queryKey: ["units"],
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className=" w-full">
      <Form {...form}>
        <FormField
          name="title"
          render={() => (
            <FormItem>
              <FormLabel>TItle</FormLabel>
              <FormControl>
                <Input placeholder="Unit's title" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          name="description"
          render={() => (
            <FormItem className=" mt-4">
              <FormLabel>Descriptions (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Unit's description" />
              </FormControl>
            </FormItem>
          )}
        />

        <div className=" w-full flex justify-end mt-4">
          <Button
            className=" rounded"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            <Save strokeWidth={1.5} />
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddEditUnit;
