import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useDebounce } from "use-debounce";
import { useAuth } from "@/provider/ProtectedRoute";
import { useInView } from "react-intersection-observer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

//
//
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PeopleItem from "./items/PeopleItem";
import Modal from "@/components/custom/Modal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipProvider,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import SWWItem from "../item/SWWItem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
//
import { getUsers } from "@/db/statement";
//icons
import { ListFilterPlus, Printer, Mail, AtSign } from "lucide-react";

//
import { type User } from "@/interface/data";
import { type RefinePeopleListProps } from "@/interface/data";
import { RefinePeopleListSchema } from "@/interface/zod";

interface UsersProps {
  list: User[];
  lastCursor: string | null;
  hasMore: boolean;
}

const People = () => {
  const [search, setSearch] = useState("");
  const [onOpen, setOnOpen] = useState(0);
  const [query] = useDebounce(search, 1000);

  const { lineId } = useParams();
  const auth = useAuth();

  const form = useForm<RefinePeopleListProps>({
    resolver: zodResolver(RefinePeopleListSchema),
  });
  const {
    handleSubmit,
    formState: { isSubmitting, errors },
  } = form;

  const { data, isFetchingNextPage, refetch, fetchNextPage } =
    useInfiniteQuery<UsersProps>({
      queryKey: ["people", lineId],
      queryFn: async ({ pageParam }) =>
        getUsers(
          auth?.token as string,
          lineId as string,
          pageParam as string | null,
          "20",
          query
        ),
      getNextPageParam: (lastPage) => lastPage.lastCursor,
      initialPageParam: null,
      enabled: !!auth?.token && !!lineId,
    });

  useEffect(() => {
    refetch();
  }, [query]);

  const currentYear = new Date().getFullYear();
  return (
    <div className=" w-full h-full">
      <TooltipProvider>
        <div className=" w-full flex items-center justify-between p-2 border border-x-0 border-b-0 border-neutral-300">
          <Input
            placeholder="Search"
            className=" max-w-sm"
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className=" flex w-auto gap-2">
            <Button variant="outline" onClick={() => setOnOpen(1)}>
              <ListFilterPlus />
              Filter
            </Button>

            <Tooltip delayDuration={2000}>
              <TooltipTrigger>
                <Button size="sm">
                  <Printer />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Table>
          <TableHeader className=" border bg-neutral-700">
            <TableHead className=" text-white">No.</TableHead>
            <TableHead className=" text-white">Username</TableHead>
            <TableHead className=" text-white">Firstname</TableHead>
            <TableHead className=" text-white">Lastname</TableHead>
            <TableHead className=" text-white">Middle name</TableHead>
            <TableHead className=" text-white">Email</TableHead>
            <TableHead className=" text-white">Designation</TableHead>
            <TableHead className=" text-white">Unit</TableHead>
            <TableHead className=" text-white">Status</TableHead>
          </TableHeader>
          <TableBody>
            {data ? (
              data.pages.flatMap((item) => item.list).length ? (
                data.pages
                  .flatMap((item) => item.list)
                  .map((item, i) => (
                    <PeopleItem
                      key={item.id}
                      item={item}
                      no={i + 1}
                      query={query}
                    />
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className=" text-center">
                    No Data found!
                  </TableCell>
                </TableRow>
              )
            ) : (
              <SWWItem colSpan={8} />
            )}
          </TableBody>
        </Table>
        <Modal
          title={"Filter"}
          onOpen={onOpen === 1}
          className={""}
          setOnOpen={() => setOnOpen(0)}
          cancelTitle="Close"
          yesTitle="Refine"
          footer={true}
        >
          <Form {...form}>
            <FormField
              name="departmentId"
              render={() => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Department" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              name="positionId"
              render={() => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder="Position" />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className=" w-full flex gap-1">
              <FormField
                name="status"
                render={({ field: { value, onBlur, onChange } }) => (
                  <FormItem className=" w-1/2">
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={onChange}
                        value={value || "all"}
                        defaultValue="all"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="inactive">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="year"
                render={({ field: { value, onBlur, onChange } }) => (
                  <FormItem className=" w-1/2">
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Type Year"
                        defaultValue={currentYear.toString()}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </Modal>
      </TooltipProvider>
    </div>
  );
};

export default People;
