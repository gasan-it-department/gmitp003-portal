import { useState } from "react";
import { useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "use-debounce";
import { isAxiosError } from "axios";
import { toast } from "sonner";

import { useAuth } from "@/provider/ProtectedRoute";
import { inviteLinks } from "@/db/statement";
import axios from "@/db/axios";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import { Badge } from "@/components/ui/badge";

import InviteLinkItem from "@/layout/human_resources/item/InviteLinkItem";

import {
  Link as LinkIcon,
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";

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
  const [text, setText] = useState("");
  const [query] = useDebounce(text, 400);

  const form = useForm<CreateInviteLinkProps>({
    resolver: zodResolver(CreateInviteLinkSchema),
    defaultValues: { expireDate: "", time: "" },
  });
  const { control, handleSubmit, reset } = form;

  const {
    data,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
  } = useInfiniteQuery<ListProps>({
    queryKey: ["invitations", lineId, query],
    queryFn: ({ pageParam }) =>
      inviteLinks(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
    enabled: !!auth.token && !!lineId,
    refetchOnWindowFocus: false,
  });

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetching && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
  });

  const createMut = useMutation({
    mutationFn: async (vals: CreateInviteLinkProps) => {
      const res = await axios.post(
        "/create-invitation",
        {
          date: vals.expireDate,
          time: vals.time || undefined,
          lineId,
        },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        },
      );
      return res.data;
    },
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({
        queryKey: ["invitations", lineId],
        refetchType: "active",
      });
      toast.success("Invitation link created");
      setOnOpen(0);
    },
    onError: (err) => {
      const msg = isAxiosError(err)
        ? err.response?.data?.message ?? err.message
        : err instanceof Error
          ? err.message
          : "Failed to create invitation link";
      toast.error(msg);
    },
  });

  const items = data?.pages.flatMap((p) => p.list) ?? [];
  const total = items.length;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-blue-600 rounded-md flex-shrink-0">
              <LinkIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-semibold text-gray-900 truncate">
                Invitation Links
              </h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">
                One-time codes for adding users to this line
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setOnOpen(1)}
            className="h-7 text-[10px] gap-1.5 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-3 w-3" />
            Create Link
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
        <InputGroup className="bg-white flex-1 max-w-xs">
          <InputGroupAddon>
            <Search className="h-3 w-3 text-gray-400" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search by code..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-[11px]"
          />
        </InputGroup>
        <span className="text-[10px] text-gray-500 ml-auto">
          {total} link{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto p-3">
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] font-semibold text-gray-700 w-10">
                  No
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[110px]">
                  Code
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                  Date Created
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 min-w-[140px]">
                  Expires
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-gray-700 text-center w-24">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-[10px] font-medium text-red-600">
                        Failed to load invitations
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(error as any)?.message ?? "Try again later."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isFetching && items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-[10px]">Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <LinkIcon className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-700">
                        No invitation links
                      </p>
                      <p className="text-[10px] text-gray-500 max-w-[260px]">
                        {query
                          ? `No links match "${query}".`
                          : "Create your first invitation link to start adding users."}
                      </p>
                      {!query && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] gap-1.5 mt-1"
                          onClick={() => setOnOpen(1)}
                        >
                          <Plus className="h-3 w-3" />
                          Create Link
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, i) => (
                  <InviteLinkItem
                    key={item.id}
                    no={i + 1}
                    item={item}
                    auth={auth}
                    lineId={lineId}
                  />
                ))
              )}

              {hasNextPage && (
                <TableRow ref={ref}>
                  <TableCell colSpan={5} className="text-center py-2">
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center gap-1.5 text-gray-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px]">Loading more...</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        Scroll to load more
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
              {!hasNextPage && items.length > 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-2 border-t">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      Showing all {items.length}
                    </Badge>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create modal */}
      <Modal
        title="Create Invitation Link"
        onOpen={onOpen === 1}
        className="max-w-md"
        setOnOpen={() => {
          if (createMut.isPending) return;
          reset();
          setOnOpen(0);
        }}
        footer={true}
        yesTitle="Create Link"
        onFunction={handleSubmit((v) => createMut.mutateAsync(v))}
        loading={createMut.isPending}
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-md">
            <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-amber-800">
                Important
              </p>
              <p className="text-[10px] text-amber-700 mt-0.5">
                Once created, an invitation link can't be edited. You can
                suspend or delete it later.
              </p>
            </div>
          </div>

          <Form {...form}>
            <div className="space-y-2.5">
              <FormField
                control={control}
                name="expireDate"
                rules={{ required: true }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5 text-blue-500" />
                      Expiration Date *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        required
                        {...field}
                        value={field.value || ""}
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">
                      Defaults to 11:59 PM on this date when time is blank.
                    </FormDescription>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-semibold text-gray-700 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5 text-blue-500" />
                      Time (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        value={field.value || ""}
                        className="h-8 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
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
