import { memo } from "react";
import { useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import {
  Briefcase,
  Building,
  Users,
  Loader2,
  ChevronRight,
  Calendar,
  Hash,
} from "lucide-react";

//
import { postJob } from "@/db/statement";
//
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
//
import type { UnitPositionProps } from "@/interface/data";
interface Props {
  item: UnitPositionProps;
  no: number;
  token: string;
  lineId: string;
  userId: string | undefined;
  query: string;
}

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
    onError: (err) => {
      toast.error("Failed to create job post", {
        description: err.message || "Please try again later",
        action: {
          label: "Retry",
          onClick: () => mutateAsync(),
        },
      });
    },
    onSuccess: (data) => {
      toast.success("Job post created successfully", {
        description: "Redirecting to job post details...",
      });
      nav(data.id);
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPending) return;
    mutateAsync();
  };

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery) return text;

    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 font-semibold px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const getSlotStatusColor = (count: number) => {
    if (count === 0) return "bg-gray-100 text-gray-600";
    if (count <= 2) return "bg-green-100 text-green-700";
    if (count <= 5) return "bg-blue-100 text-blue-700";
    return "bg-purple-100 text-purple-700";
  };

  const getSlotStatusText = (count: number) => {
    if (count === 0) return "No slots";
    if (count === 1) return "1 slot";
    return `${count} slots`;
  };

  return (
    <TooltipProvider>
      <div
        className="relative px-6 py-4 border-b border-gray-100 cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-center justify-between">
          {/* Left side: Position info */}
          <div className="flex-1">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Serial number */}
              <div className="col-span-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                  <span className="text-sm font-semibold text-gray-700">
                    {no}
                  </span>
                </div>
              </div>

              {/* Position title */}
              <div className="col-span-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-md bg-primary/10">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {highlightText(item.position.name, query)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge
                        variant="outline"
                        className="text-xs font-normal border-gray-200"
                      >
                        <Hash className="h-3 w-3 mr-1" />
                        {item.id.substring(0, 8)}...
                      </Badge>
                      {item.fixToUnit && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-amber-50 text-amber-700 border-amber-200"
                        >
                          Fixed to Unit
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {item.itemNumber && item.itemNumber !== "N/A" && (
                        <div className="text-xs text-gray-500">
                          Item: {item.itemNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Department info */}
              <div className="col-span-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 rounded-md bg-blue/10">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.unit.name || "N/A"}
                    </p>
                    {item.designation && item.designation !== "N/A" && (
                      <p className="text-sm text-gray-500 mt-1">
                        {item.designation}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Slots info */}
              <div className="col-span-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div
                        className={`px-4 py-2 rounded-full ${getSlotStatusColor(item._count.slot)}`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-bold">{item._count.slot}</span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1.5">
                        {getSlotStatusText(item._count.slot)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Available positions for this role</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Right side: Action button */}
          <div className="ml-4">
            {isPending ? (
              <Button disabled size="sm" className="px-6 bg-primary/10">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="border-gray-300">
                <span className="mr-2">Post Job</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Loading overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Creating job post...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Redirecting to details page
              </p>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-100"></div>
      </div>
    </TooltipProvider>
  );
};

export default memo(PositionSelectItem);
