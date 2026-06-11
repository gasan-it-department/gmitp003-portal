import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/provider/ProtectedRoute";
import { salaryGradeInfo } from "@/db/statements/salaryGrade";

// tabs
import SalaryGradeHistoryTab from "@/layout/human_resources/salary/SalaryGradeHistoryTab";
import SalaryGradeUsersTab from "@/layout/human_resources/salary/SalaryGradeUsersTab";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import {
  Landmark,
  Banknote,
  Users,
  History,
  Calendar,
  ArrowLeft,
} from "lucide-react";

interface SalaryGradeInfo {
  id: string;
  grade: number;
  amount: number;
  createdAt: string;
  lineId: string | null;
  _count?: { users?: number; SalaryGradeHistory?: number };
}

const SalaryGradeDetail = () => {
  const { lineId, salaryGradeId } = useParams();
  const auth = useAuth();
  const nav = useNavigate();

  const { data, isFetching } = useQuery<SalaryGradeInfo>({
    queryKey: ["salary-grade-info", salaryGradeId],
    queryFn: () =>
      salaryGradeInfo(auth.token as string, salaryGradeId as string),
    enabled: !!salaryGradeId,
    refetchOnWindowFocus: false,
  });

  if (isFetching && !data) {
    return (
      <div className="w-full h-full p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const userCount = data?._count?.users ?? 0;
  const histCount = data?._count?.SalaryGradeHistory ?? 0;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex-none border-b bg-white">
        <div className="px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[11px] gap-1 text-gray-500 hover:text-gray-800 mb-2 -ml-1"
            onClick={() => nav(`/${lineId}/human-resources/salary`)}
          >
            <ArrowLeft className="h-3 w-3" />
            Salary Grades
          </Button>

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-gray-900">
                    Salary Grade{" "}
                    <span className="font-mono">{data?.grade ?? "—"}</span>
                  </h1>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] px-1.5 py-0 gap-1 font-semibold"
                  >
                    <Banknote className="w-3 h-3" />₱
                    {data?.amount?.toLocaleString("en-PH") ?? "0"}
                    <span className="font-normal text-emerald-600">/mo</span>
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Created{" "}
                  {data?.createdAt
                    ? new Date(data.createdAt).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>

            {/* Quick counters */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="px-2 py-1 bg-white gap-1.5 text-[10px]"
              >
                <Users className="w-3 h-3 text-gray-500" />
                <span className="font-semibold">{userCount}</span>
                <span className="text-gray-500">
                  user{userCount !== 1 ? "s" : ""}
                </span>
              </Badge>
              <Badge
                variant="outline"
                className="px-2 py-1 bg-white gap-1.5 text-[10px]"
              >
                <History className="w-3 h-3 text-gray-500" />
                <span className="font-semibold">{histCount}</span>
                <span className="text-gray-500">
                  change{histCount !== 1 ? "s" : ""}
                </span>
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 px-4 py-3 flex flex-col max-w-5xl mx-auto w-full">
        <Tabs defaultValue="history" className="w-full h-full flex flex-col">
          <div className="flex-none">
            <TabsList className="bg-white border shadow-sm p-1 w-full sm:w-auto justify-start h-8">
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 h-6 text-[11px] gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Value History
                {histCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 text-[9px] leading-none ml-1"
                  >
                    {histCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-primary data-[state=active]:text-white px-3 h-6 text-[11px] gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                Users
                {userCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 px-1 text-[9px] leading-none ml-1"
                  >
                    {userCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 mt-3 min-h-0">
            <TabsContent
              value="history"
              className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <Card className="h-full border shadow-sm overflow-hidden flex flex-col">
                <CardContent className="p-0 h-full min-h-0 flex-1 flex flex-col">
                  <SalaryGradeHistoryTab
                    salaryGradeId={salaryGradeId as string}
                    token={auth.token as string}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="users"
              className="h-full mt-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <Card className="h-full border shadow-sm overflow-hidden flex flex-col">
                <CardContent className="p-0 h-full min-h-0 flex-1 flex flex-col">
                  <SalaryGradeUsersTab
                    salaryGradeId={salaryGradeId as string}
                    token={auth.token as string}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default SalaryGradeDetail;
