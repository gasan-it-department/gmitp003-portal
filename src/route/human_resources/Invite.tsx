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
import { Link, Plus, Calendar, Clock, AlertCircle } from "lucide-react";

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
  const { control, handleSubmit, reset } = form;

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
      reset();
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

  const allInvites = data?.pages.flatMap((page) => page.list) || [];
  const totalInvites = allInvites.length;

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-2 lg:px-3 py-2">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                <Link className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Invitation Links
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Create and manage invitation links for users to join this line
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => setOnOpen(1)}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Create Link
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Create new invitation link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="w-16 font-semibold text-gray-700">
                    No.
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Code
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Date Created
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Date Expiration
                  </TableHead>
                  <TableHead className="w-24 font-semibold text-gray-700">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data ? (
                  allInvites.length > 0 ? (
                    allInvites.map((item, i) => (
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
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <div className="bg-gray-50 rounded-full p-4 mb-3">
                            <Link className="h-10 w-10" />
                          </div>
                          <p className="text-gray-500 font-medium">
                            No invitation links found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Create your first invitation link to get started
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOnOpen(1)}
                            className="mt-4 gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Create Invite Link
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48">
                      <SWWItem colSpan={5} />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer Stats */}
          {totalInvites > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t text-sm text-gray-500">
              Showing {totalInvites} invitation{totalInvites !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Create Invite Link Modal */}
      <Modal
        title="Create Invite Link"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          setOnOpen(0);
          reset();
        }}
        footer={true}
        yesTitle="Create Link"
        onFunction={handleSubmit(onSubmit)}
      >
        <div className="space-y-5 p-1">
          {/* Warning Alert */}
          <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-800 mb-0.5">
                  Important Notice
                </p>
                <p className="text-xs text-amber-700">
                  Invitation links cannot be updated once created. Please review
                  the expiration date carefully.
                </p>
              </div>
            </div>
          </div>

          <Form {...form}>
            <div className="space-y-4">
              {/* Expiration Date Field */}
              <FormField
                control={control}
                name="expireDate"
                rules={{
                  required: true,
                }}
                render={({ field: { onBlur, onChange, value } }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Expiration Date *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        required
                        onChange={onChange}
                        onBlur={onBlur}
                        value={value || ""}
                        className="h-9 text-sm"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      The link will expire at 11:59 PM on this date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Field - Optional */}
              <FormField
                control={control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      Time (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value || ""}
                        className="h-9 text-sm"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Leave empty to use default expiration time (11:59 PM)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default Invite;
