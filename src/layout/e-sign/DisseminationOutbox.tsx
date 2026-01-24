import { useState } from "react";
import zod from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import { Input } from "@/components/ui/input";
//interface/schema/props
const NewDisseminationRoomSchema = zod.object({
  roomName: zod.string().min(2, "Subject must be at least 2 characters"),
});

type NewDisseminationRoomFormProps = zod.infer<
  typeof NewDisseminationRoomSchema
>;

const DisseminationOutbox = () => {
  const [onOpen, setOnOpen] = useState(0);

  const nav = useNavigate();

  const form = useForm({
    resolver: zodResolver(NewDisseminationRoomSchema),
    defaultValues: {
      roomName: "",
    },
  });
  const { handleSubmit, control } = form;

  const onSubmit = async (data: NewDisseminationRoomFormProps) => {
    try {
      nav(`set-up/${data.roomName}`);
    } catch (error) {}
  };
  return (
    <div className=" w-full h-full">
      <div className="w-full p-2">
        <Button size="sm" onClick={() => setOnOpen(1)}>
          Initiate
        </Button>
      </div>
      <Modal
        title={"New Dissemination Room"}
        children={
          <div className=" w-full">
            <Form {...form}>
              <FormField
                control={control}
                name="roomName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        }
        onFunction={handleSubmit(onSubmit)}
        footer={true}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default DisseminationOutbox;
