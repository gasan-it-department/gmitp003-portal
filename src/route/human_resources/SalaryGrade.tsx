import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import { lineSGlist } from "@/db/statements/salaryGrade";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, Users } from "lucide-react";
import type { SalaryGrade as SalaryGradeProps } from "@/interface/data";
import SalaryGradeItem from "@/layout/human_resources/item/SalaryGradeItem";

interface ListProps {
  list: SalaryGradeProps[];
  hasMore: boolean;
  lastCursor: string | null;
}

const SalaryGrade = () => {
  const auth = useAuth();
  const { lineId } = useParams();
  const { ref, inView } = useInView();

  const {
    data,
    isFetchingNextPage,
    isFetching,
    hasNextPage,
    fetchNextPage,
    status,
    error,
  } = useInfiniteQuery<ListProps>({
    queryFn: ({ pageParam }) =>
      lineSGlist(
        auth.token as string,
        lineId,
        pageParam as string | null,
        "20",
        "",
      ),
    queryKey: ["salary-grade", lineId],
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.lastCursor ? lastPage.lastCursor : undefined,
  });

  // Trigger fetch when scroll reaches the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allSalaryGrades = data?.pages.flatMap((page) => page.list) || [];
  const totalCount = allSalaryGrades.length;

  if (status === "pending") {
    return <LoadingSkeleton />;
  }

  if (status === "error") {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              Failed to load salary grades: {error.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 max-w-7xl h-full relative overflow-auto">
      <Card className="border shadow-sm">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 bg-white z-20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">
                Salary Grades
              </CardTitle>
              <CardDescription>
                Total: {totalCount} grades • Line ID: {lineId}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {isFetching ? "Syncing..." : "Up to date"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div>
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="w-20 text-center">Grade</TableHead>
                  <TableHead className="min-w-32">Salary Amount</TableHead>
                  <TableHead className="min-w-40">Users</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSalaryGrades.length === 0 ? (
                  <TableRow className="">
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-10 w-10 mb-2 opacity-30" />
                        <p>No salary grades found</p>
                        <p className="text-sm">
                          Create your first salary grade to get started
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {allSalaryGrades.map((grade) => (
                      <SalaryGradeItem
                        key={grade.id}
                        item={grade}
                        userId={auth.userId as string}
                        token={auth.token as string}
                        lineId={lineId as string}
                      />
                    ))}

                    {/* Infinite scroll trigger */}
                    <TableRow ref={ref} className="h-20">
                      <TableCell colSpan={6} className="text-center p-4">
                        {isFetchingNextPage ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">
                              Loading more...
                            </span>
                          </div>
                        ) : hasNextPage ? (
                          <Button
                            variant="ghost"
                            onClick={() => fetchNextPage()}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            Load more
                          </Button>
                        ) : totalCount > 0 ? (
                          <div className="text-sm text-muted-foreground">
                            All salary grades loaded
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Loading indicator for initial fetch */}
          {isFetching && !isFetchingNextPage && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-background p-4 rounded-lg shadow">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading salary grades...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="container mx-auto p-6 max-w-7xl h-full">
    <Card className="border shadow-sm">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-24 mx-auto" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
);

export default SalaryGrade;
