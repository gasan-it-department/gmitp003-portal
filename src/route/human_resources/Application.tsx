import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { useDebounce } from "use-debounce";
import { useInView } from "react-intersection-observer";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//db and statement
import { lineApplications } from "@/db/statement";
//layout/components
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import SWWItem from "@/layout/item/SWWItem";
import ApplicationItem from "@/layout/human_resources/item/ApplicationItem";
import ContactApplicant from "@/layout/human_resources/ContactApplicant";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import Modal from "@/components/custom/Modal";
import PositionSelect from "@/layout/human_resources/PositionSelect";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import FormTags from "@/layout/FormTags";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
//icons
import {
  FolderPlus,
  Search,
  Filter,
  SquareCheckBig,
  Square,
  CalendarArrowDown,
  CalendarArrowUp,
  ListRestart,
  EllipsisVertical,
  PhoneForwarded,
  Users,
  FileText,
  Briefcase,
} from "lucide-react";

//
import type { SubmittedApplicationProps } from "@/interface/data";
import { RefineApplicationSchema } from "@/interface/zod";

interface ListProps {
  list: SubmittedApplicationProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const Application = () => {
  const { lineId } = useParams();
  const [text, setText] = useState("");
  const [onOpen, setOnOpen] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [onMultiSelect, setOnMultiSelect] = useState(false);
  const [query] = useDebounce(text, 1000);
  const auth = useAuth();
  const nav = useNavigate();

  const { ref, inView } = useInView();

  const form = useForm({
    resolver: zodResolver(RefineApplicationSchema),
    defaultValues: {
      dateFrom: "",
      dateTo: "",
      tags: [],
      positionId: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
    setError,
    getValues,
    setValue,
  } = form;

  const allTags = getValues("tags");
  const dateTo = getValues("dateTo");
  const dateFrom = getValues("dateFrom");
  const position = getValues("positionId");

  const {
    data,
    isFetchingNextPage,
    isFetching,
    fetchNextPage,
    refetch,
    hasNextPage,
    isError,
  } = useInfiniteQuery<ListProps>({
    queryKey: [
      "applications",
      lineId,
      query,
      allTags,
      dateFrom,
      dateTo,
      position,
    ],
    queryFn: ({ pageParam }) =>
      lineApplications(
        auth.token as string,
        lineId as string,
        pageParam as string | null,
        "20",
        query,
        allTags.map((item) => item.tag),
        dateFrom,
        dateTo,
        position
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastCursor : undefined,
  });

  const tags = useFieldArray({
    control,
    name: "tags",
  });

  const handleRemoveTags = (index: number) => {
    tags.remove(index);
  };

  const handleCheckSelected = (id: string) => {
    return selected.includes(id);
  };

  const handleAddSelected = (id: string) => {
    setSelected((prev) => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleCheckTags = (tag: string) => {
    const index = tags.fields.findIndex((item) => item.tag === tag);
    if (index !== -1) return { res: true, index };
    return { res: false, index };
  };

  const handleAddTags = (tag: string, cont: string) => {
    const index = handleCheckTags(tag);
    if (index.res) {
      return handleRemoveTags(index.index);
    }
    tags.append({ cont, tag });
  };

  const handleReset = async () => {
    setValue("dateFrom", "");
    setValue("dateTo", "");
    setValue("positionId", "");
    setValue("tags", []);
    refetch();
  };

  const onSubmit = async () => {
    try {
      refetch();
      setOnOpen(0);
    } catch (error) {
      setError("root", { message: "Failed to submit" });
    }
  };

  useEffect(() => {
    refetch();
  }, [query, refetch]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allApplications = data?.pages.flatMap((item) => item.list) || [];
  const totalCount = allApplications.length;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 p-6 bg-gradient-to-r from-blue-50 to-white rounded-xl shadow-sm border">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600">
              {totalCount} applications found
              {isFetching && " • Updating..."}
              {selected.length > 0 && ` • ${selected.length} selected`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <InputGroup className="lg:w-80">
            <InputGroupAddon>
              <Search className="w-4 h-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search by name, position, or email..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </InputGroup>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={onMultiSelect ? "default" : "outline"}
              onClick={() => {
                setOnMultiSelect(!onMultiSelect);
                if (onMultiSelect) setSelected([]);
              }}
              className="gap-2"
            >
              {onMultiSelect ? (
                <SquareCheckBig className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {onMultiSelect ? "Cancel Select" : "Select"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setOnOpen(1)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline">
                  <EllipsisVertical className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48">
                <div className="space-y-1">
                  {selected.length > 0 && (
                    <Button
                      className="w-full justify-start"
                      size="sm"
                      variant="ghost"
                      onClick={() => setOnOpen(2)}
                    >
                      <PhoneForwarded className="w-4 h-4 mr-2" />
                      Contact ({selected.length})
                    </Button>
                  )}
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    variant="ghost"
                    onClick={() => nav("post")}
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Posting
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Active Filters Badges */}
      {(dateFrom || dateTo || position || allTags.length > 0) && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>
            {dateFrom && dateTo && (
              <Badge variant="secondary" className="gap-1">
                <CalendarArrowDown className="w-3 h-3" />
                {dateFrom} to {dateTo}
              </Badge>
            )}
            {position && (
              <Badge variant="secondary">
                <Briefcase className="w-3 h-3 mr-1" />
                Position
              </Badge>
            )}
            {allTags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag.tag}
              </Badge>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="h-6 px-2 text-xs"
            >
              <ListRestart className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full">
            <div className="min-w-full">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0 z-10">
                  <TableRow>
                    {onMultiSelect && (
                      <TableHead className="w-12 font-semibold text-gray-700">
                        <div className="flex items-center">
                          <SquareCheckBig className="w-4 h-4 mr-1" />
                          {selected.length}
                        </div>
                      </TableHead>
                    )}
                    <TableHead className="w-16 font-semibold text-gray-700">
                      No.
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Position
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Applicant
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Date Filed
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {/* Initial Loading */}
                  {isFetching && allApplications.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={onMultiSelect ? 6 : 5}
                        className="py-12"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Spinner className="w-8 h-8 mb-3" />
                          <p className="text-gray-600">
                            Loading applications...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {/* Error State */}
                  {isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={onMultiSelect ? 6 : 5}
                        className="py-12"
                      >
                        <SWWItem colSpan={onMultiSelect ? 6 : 5} />
                      </TableCell>
                    </TableRow>
                  ) : null}

                  {/* Applications List */}
                  {allApplications.length > 0 ? (
                    <>
                      {allApplications.map((item, index) => (
                        <ApplicationItem
                          key={`${item.id}-${index}`}
                          item={item}
                          no={index + 1}
                          query={query}
                          onMultiSelect={onMultiSelect}
                          handleCheckSelected={handleCheckSelected}
                          handleAddSelected={handleAddSelected}
                        />
                      ))}

                      {/* Infinite Scroll Loading */}
                      {isFetchingNextPage && (
                        <TableRow>
                          <TableCell
                            colSpan={onMultiSelect ? 6 : 5}
                            className="py-4"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <Spinner className="w-4 h-4" />
                              <span className="text-sm text-gray-500">
                                Loading more applications...
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Intersection Observer Trigger */}
                      {hasNextPage && !isFetchingNextPage && (
                        <TableRow ref={ref}>
                          <TableCell
                            colSpan={onMultiSelect ? 6 : 5}
                            className="h-4 p-0"
                          ></TableCell>
                        </TableRow>
                      )}
                    </>
                  ) : (
                    !isFetching && (
                      <TableRow>
                        <TableCell
                          colSpan={onMultiSelect ? 6 : 5}
                          className="py-12"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Users className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-lg font-medium text-gray-600">
                              No applications found
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {query
                                ? "Try a different search term"
                                : "Start by creating a new job posting"}
                            </p>
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() => nav("post")}
                            >
                              <FolderPlus className="w-4 h-4 mr-2" />
                              Create Job Posting
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Footer Stats */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            Showing {totalCount} applications
          </span>
          {isFetchingNextPage && (
            <span className="flex items-center text-blue-600">
              <Spinner className="w-3 h-3 mr-1" />
              Loading more...
            </span>
          )}
        </div>
        {hasNextPage && !isFetchingNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            Load More Applications
          </Button>
        )}
      </div>

      {/* Filter Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Applications
          </div>
        }
        children={
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={isFetching || isFetchingNextPage || isSubmitting}
              >
                <ListRestart className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>

            <Form {...form}>
              <form className="space-y-6">
                {/* Date Range */}
                <div>
                  <FormLabel className="text-base font-medium">
                    Date Range
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <FormField
                      control={control}
                      name="dateFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">From</FormLabel>
                          <FormControl>
                            <InputGroup>
                              <InputGroupAddon>
                                <CalendarArrowDown className="w-4 h-4" />
                              </InputGroupAddon>
                              <InputGroupInput type="date" {...field} />
                            </InputGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name="dateTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">To</FormLabel>
                          <FormControl>
                            <InputGroup>
                              <InputGroupAddon>
                                <CalendarArrowUp className="w-4 h-4" />
                              </InputGroupAddon>
                              <InputGroupInput type="date" {...field} />
                            </InputGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Position */}
                <div>
                  <FormLabel className="text-base font-medium">
                    Position
                  </FormLabel>
                  <FormField
                    control={control}
                    name="positionId"
                    render={({ field }) => (
                      <FormItem className="mt-2">
                        <FormControl>
                          <PositionSelect
                            onChange={field.onChange}
                            value={field.value as string}
                            id={lineId as string}
                            token={auth.token as string}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Tags */}
                <div>
                  <FormLabel className="text-base font-medium">Tags</FormLabel>
                  <div className="mt-2">
                    <FormTags
                      handleAddTags={handleAddTags}
                      handleCheckTags={handleCheckTags}
                    />
                  </div>
                </div>
              </form>
            </Form>
          </div>
        }
        onOpen={onOpen === 1}
        className="min-w-2xl max-h-11/12 overflow-auto"
        setOnOpen={() => setOnOpen(0)}
        cancelTitle="Cancel"
        yesTitle="Apply Filters"
        footer={true}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting || isFetchingNextPage || isFetching}
      />

      {/* Contact Modal */}
      <Modal
        footer={1}
        title={
          <div className="flex items-center gap-2">
            <PhoneForwarded className="w-5 h-5" />
            Contact Applicants ({selected.length})
          </div>
        }
        children={
          <div className="w-full">
            <ContactApplicant
              token={auth.token as string}
              setOnOpen={setOnOpen}
              applicationId={""}
              ids={selected}
              many={0}
            />
          </div>
        }
        onOpen={onOpen === 2}
        className="max-w-2xl max-h-11/12 overflow-auto"
        setOnOpen={() => setOnOpen(0)}
      />
    </div>
  );
};

export default Application;
