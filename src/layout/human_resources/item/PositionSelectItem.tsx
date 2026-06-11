import { memo } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { postJob } from "@/db/statement";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Briefcase,
  Building,
  Users,
  Loader2,
  ChevronRight,
  Calendar,
  Hash,
} from "lucide-react";

import type { UnitPositionProps } from "@/interface/data";

interface Props {
  item: UnitPositionProps;
  no: number;
  token: string;
  lineId: string;
  userId: string | undefined;
  query: string;
}

const highlight = (text: string, q: string) => {
  if (!q || !text) return text;
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="bg-yellow-100 text-yellow-900 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    ),
  );
};

const slotColor = (n: number) => {
  if (n === 0) return "bg-gray-50 text-gray-500 border-gray-200";
  if (n <= 2) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (n <= 5) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-purple-50 text-purple-700 border-purple-200";
};

const PositionSelectItem = ({
  item,
  no,
  token,
  lineId,
  userId,
  query,
}: Props) => {
  const nav = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      postJob(
        token,
        0,
        false,
        false,
        undefined,
        item.id,
        lineId,
        userId as string,
      ),
    onSuccess: (data) => {
      toast.success("Job post created");
      nav(data.id);
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ??
          (err instanceof Error ? err.message : "Failed to create job post"),
      );
    },
  });

  return (
    <TableRow
      className="hover:bg-blue-50/40 cursor-pointer"
      onClick={() => {
        if (!isPending) mutateAsync();
      }}
    >
      <TableCell className="text-[10px] text-gray-500">{no}</TableCell>
      <TableCell>
        <div className="flex items-start gap-1.5">
          <div className="p-1 bg-blue-50 rounded flex-shrink-0">
            <Briefcase className="h-3 w-3 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {highlight(item.position.name, query)}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500">
              <span className="flex items-center gap-0.5">
                <Hash className="h-2.5 w-2.5" />
                {item.id.slice(0, 8)}
              </span>
              <span className="flex items-center gap-0.5">
                <Calendar className="h-2.5 w-2.5" />
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
              {item.itemNumber && item.itemNumber !== "N/A" && (
                <span>Item: {item.itemNumber}</span>
              )}
              {item.fixToUnit && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200"
                >
                  Fixed
                </Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-start gap-1.5">
          <Building className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-gray-800 truncate">
              {item.unit.name || "—"}
            </p>
            {item.designation && item.designation !== "N/A" && (
              <p className="text-[10px] text-gray-500 truncate">
                {item.designation}
              </p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 gap-1 ${slotColor(item._count.slot)}`}
        >
          <Users className="h-2.5 w-2.5" />
          {item._count.slot}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            if (!isPending) mutateAsync();
          }}
          className="h-7 text-[10px] gap-1.5"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Post Job
              <ChevronRight className="h-3 w-3" />
            </>
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default memo(PositionSelectItem);
