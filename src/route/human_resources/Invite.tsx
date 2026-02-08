import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { useParams } from "react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//layout and components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Modal from "@/components/custom/Modal";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormMessage,
  FormField,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import InviteLinkItem from "@/layout/human_resources/item/InviteLinkItem";
import SWWItem from "@/layout/item/SWWItem";
//db
import { inviteLinks } from "@/db/statement";
//import { createInviteLink } from "@/db/statement";
//
import { Link } from "lucide-react";

//interfaces and props
import type {
  InvitationLinkProps,
  CreateInviteLinkProps,
} from "@/interface/data";
import { CreateInviteLinkSchema } from "@/interface/zod";
interface ListProps {
  list: InvitationLinkProps[];
  lastCursor: string | null;
  hasMore: boolean;
}

const Invite = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { lineId } = useParams();

  const [onOpen, setOnOpen] = useState(0);

  const form = useForm({
    resolver: zodResolver(CreateInviteLinkSchema),
  });
  const { control, handleSubmit, setValue } = form;

  const { data } = useInfiniteQuery<ListProps>({
    queryKey: ["invitations", lineId],
    queryFn: ({ pageParam }) =>
      inviteLinks(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        "",
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.lastCursor,
  });

  const onSubmit = async (data: CreateInviteLinkProps) => {
    console.log(data);

    try {
      const response = await axios.post(
        "/create-invitation",
        { date: data.expireDate, time: data.time, lineId },
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
        toast.error(`Something went wrong!`, {
          closeButton: false,
          description: `${response.data}`,
        });
      }
      setValue("expireDate", "");
      setValue("time", "");
      await queryClient.invalidateQueries({
        queryKey: ["invitations", lineId],
        refetchType: "active",
      });
      toast.success("Created Successfully!", {
        closeButton: false,
      });
      setOnOpen(0);
    } catch (error) {
      toast.error("Failed to create invitation link", {
        closeButton: false,
        description: `${error}`,
      });
    }
  };
  return (
    <div className=" w-full h-full">
      <TooltipProvider>
        <div className=" w-full p-2 flex justify-end">
          <Tooltip>
            <TooltipTrigger>
              <Button size="sm" onClick={() => setOnOpen(1)}>
                <Link />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Create Invite link</TooltipContent>
          </Tooltip>
        </div>
        <Table>
          <TableHeader className=" border bg-neutral-700">
            <TableHead className=" text-white ">No</TableHead>
            <TableHead className=" text-white ">Code</TableHead>
            <TableHead className=" text-white ">Date Created</TableHead>
            <TableHead className=" text-white ">Date Expiration</TableHead>
            <TableHead className=" text-white ">Status</TableHead>
          </TableHeader>
          <TableBody>
            {data ? (
              data.pages.flatMap((item) => item.list).length > 0 ? (
                data.pages
                  .flatMap((item) => item.list)
                  .map((item, i) => (
                    <InviteLinkItem
                      no={i + 1}
                      item={item}
                      key={item.id}
                      auth={auth}
                      lineId={lineId}
                    />
                  ))
              ) : (
                <TableRow>
                  <TableCell className=" text-center" colSpan={5}>
                    No data found!
                  </TableCell>
                </TableRow>
              )
            ) : (
              <SWWItem colSpan={5} />
            )}
          </TableBody>
        </Table>
      </TooltipProvider>
      <Modal
        title={"Create Invite Link"}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
        footer={true}
        yesTitle="Continue"
        onFunction={handleSubmit(onSubmit)}
      >
        <Form {...form}>
          <FormDescription>
            WARNING: The invite link cannot be update once created
          </FormDescription>
          <FormField
            control={control}
            name="expireDate"
            rules={{
              required: true,
            }}
            render={({ field: { onBlur, onChange } }) => (
              <FormItem>
                <FormLabel>Expiration Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    required
                    onChange={onChange}
                    onBlur={onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time - Optional */}
          <FormField
            control={control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Time (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    {...field}
                    value={field.value || ""} // Handle optional value
                  />
                </FormControl>
                <FormDescription>
                  Leave empty to use default time
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default Invite;
