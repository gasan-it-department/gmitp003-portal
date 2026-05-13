import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "@/provider/ProtectedRoute";
//
import { Loader2, ClipboardList, Stethoscope, Pill, ClipboardCheck, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
//
import type { PatientRecordListProps } from "@/interface/data";
import { patientRecordList } from "@/db/statements/patient";

const recordTypeMeta: Record<number, {
  label: string;
  variant: "default" | "secondary" | "outline";
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}> = {
  0: { label: "Diagnosis",         variant: "outline",    icon: Stethoscope,    iconColor: "text-purple-600", bgColor: "bg-purple-100" },
  1: { label: "Prescribed",        variant: "secondary",  icon: ClipboardCheck, iconColor: "text-blue-600",   bgColor: "bg-blue-100"   },
  2: { label: "Medicine Received", variant: "default",    icon: Pill,           iconColor: "text-green-600",  bgColor: "bg-green-100"  },
};

interface Props {
  patientId: string;
}

const PatientRecords = ({ patientId }: Props) => {
  const auth = useAuth();
  const nav = useNavigate();
  const { lineId } = useParams();

  const { data, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery<PatientRecordListProps>({
      queryKey: ["patient-records", patientId],
      queryFn: ({ pageParam }) =>
        patientRecordList(
          auth.token as string,
          patientId,
          pageParam as string | null,
          "10",
        ),
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.lastCursor : undefined,
      initialPageParam: null,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    });

  const records = data ? data.pages.flatMap((p) => p.list) : [];

  const { ref } = useInView({
    threshold: 0.5,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  if (isFetching && records.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 gap-1.5 text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-xs">Loading records...</span>
      </div>
    );
  }

  if (!isFetching && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center p-3">
        <ClipboardList className="h-7 w-7 text-gray-300 mb-2" />
        <p className="text-xs font-medium text-gray-500">No records yet</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Medical records will appear here once added
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {records.map((rec, i) => {
        const meta = recordTypeMeta[rec.type] ?? recordTypeMeta[0];
        const Icon = meta.icon;
        return (
          <button
            type="button"
            key={rec.id}
            onClick={() => nav(`/${lineId}/patients-record/${patientId}/record/${rec.id}`)}
            className="w-full flex items-start gap-2.5 p-3 hover:bg-blue-50 transition-colors text-left group cursor-pointer"
          >
            {/* Index bubble */}
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-[10px] font-medium flex-shrink-0 mt-0.5">
              {i + 1}
            </div>

            {/* Type icon */}
            <div className={`flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 mt-0.5 ${meta.bgColor}`}>
              <Icon className={`h-3 w-3 ${meta.iconColor}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant={meta.variant} className="text-[10px] px-1.5 py-0 leading-none">
                  {meta.label}
                </Badge>
                <p className="text-[10px] text-gray-400">
                  {new Date(rec.timestamp).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              {rec.diagnose && (
                <p className="text-xs text-gray-600 mt-0.5 truncate">{rec.diagnose}</p>
              )}
            </div>

            <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
          </button>
        );
      })}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div
          ref={ref}
          className="flex items-center justify-center py-3 gap-1.5"
        >
          {isFetchingNextPage && (
            <>
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
              <span className="text-[10px] text-gray-400">Loading more...</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientRecords;
