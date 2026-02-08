import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
import {
  Users,
  FileText,
  Briefcase,
  Building,
  Megaphone,
  FileEdit,
  // ArrowUp,
  // ArrowDown,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { humanResourcesDashboard } from "@/db/statements/dashboard";
import type { HumanResourcesDashboardProps } from "@/interface/data";

const Dashboard = () => {
  const { lineId } = useParams();
  const auth = useAuth();

  const { data, isFetching, error } = useQuery<HumanResourcesDashboardProps>({
    queryKey: ["human-resources", lineId],
    queryFn: () =>
      humanResourcesDashboard(auth.token as string, lineId as string),
    enabled: !!lineId && !!auth.token,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  if (isFetching) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Card className="max-w-md border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>
              Unable to fetch dashboard data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              Select a line or check your permissions to view dashboard data.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: "Employees",
      value: data.employees,
      icon: Users,
      color: "bg-blue-500",
      description: "Total active employees",
      trend: 12, // This could be dynamic from API
    },
    {
      title: "Applications",
      value: data.applications,
      icon: FileText,
      color: "bg-green-500",
      description: "Pending job applications",
      trend: 8,
    },
    {
      title: "Posted Jobs",
      value: data.postedJobs,
      icon: Briefcase,
      color: "bg-purple-500",
      description: "Active job postings",
      trend: 5,
    },
    {
      title: "Vacancies",
      value: data.vacancies,
      icon: Building,
      color: "bg-amber-500",
      description: "Open positions",
      trend: -3,
    },
    {
      title: "Live Announcements",
      value: data.announcementsLive,
      icon: Megaphone,
      color: "bg-emerald-500",
      description: "Published announcements",
      trend: 2,
    },
    {
      title: "Draft Announcements",
      value: data.announcementDraft,
      icon: FileEdit,
      color: "bg-gray-500",
      description: "Unpublished drafts",
      trend: 4,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                HR Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Overview of your human resources metrics and activities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                Line: {lineId?.toUpperCase()}
              </Badge>
              {/* <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Report
              </Button> */}
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <p className="text-sm text-gray-500 mt-1">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Cards */}

        {/* Activity Section */}
        {/* <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and changes</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">New application received</p>
                  <p className="text-sm text-gray-500">
                    Software Engineer position
                  </p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded">
                  <Megaphone className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Announcement published</p>
                  <p className="text-sm text-gray-500">
                    Quarterly meeting schedule
                  </p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
              <div className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Job posting closed</p>
                  <p className="text-sm text-gray-500">
                    Marketing Manager position
                  </p>
                </div>
                <span className="text-sm text-gray-500">2 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
};

// Skeleton Loader Component
const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gray-50 p-4 md:p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default Dashboard;
