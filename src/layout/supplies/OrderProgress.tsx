import React from "react";
import { Progress } from "@/components/ui/progress";
import { iconMainColor } from "@/utils/helper";
import {
  ClipboardList,
  SearchCheck,
  CircleCheck,
  Truck,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  status: number; // 0: Draft, 1: Review, 2: Approved, 3: In Transit, 4: Delivered
}

const OrderProgress = ({ status }: Props) => {
  const phases = [
    {
      title: "Draft",
      description: "Preparation: Add, update and remove item/s.",
      icon: <ClipboardList color={iconMainColor} />,
      status: 0,
    },
    {
      title: "Under Review",
      description: "Checking: Person incharge reviewing the Purchase Request.",
      icon: <SearchCheck color={iconMainColor} />,
      status: 1,
    },
    {
      title: "Approved",
      description: "Checked: Order has been approved.",
      icon: <CircleCheck color={iconMainColor} />,
      status: 2,
      component: (
        <Button size="sm" variant="outline">
          View
        </Button>
      ),
    },

    {
      title: "Completed",
      description: "Finish: Order is Completed",
      icon: <PackageCheck color={iconMainColor} />,
      status: 3,
    },
  ];

  const progressPercentage = (status / (phases.length - 1)) * 100;

  return (
    <div className="w-full bg-white">
      <div className="mb-6">
        <Progress value={progressPercentage} className="h-2" />
        <p className="text-sm text-neutral-600 mt-2">
          {status === 4
            ? "Completed"
            : `Step ${status + 1} of ${phases.length}`}
        </p>
      </div>

      <div className="relative">
        {/* Vertical connection line */}
        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-neutral-200 z-0"></div>

        <div className="space-y-6 relative z-10">
          {phases.map((phase, index) => {
            const isCompleted = index < status;
            const isCurrent = index === status;

            return (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`p-1.5 rounded-full ${
                      isCompleted
                        ? "bg-green-100"
                        : isCurrent
                        ? "bg-blue-100"
                        : "bg-neutral-100"
                    }`}
                  >
                    <div
                      className={`p-1 rounded-full ${
                        isCompleted
                          ? "bg-green-500"
                          : isCurrent
                          ? "bg-blue-500"
                          : "bg-neutral-300"
                      }`}
                    >
                      {React.cloneElement(phase.icon, {
                        size: 16,
                        color:
                          isCompleted || isCurrent ? "white" : iconMainColor,
                      })}
                    </div>
                  </div>
                  {index < phases.length - 1 && (
                    <div
                      className={`w-0.5 h-6 ${
                        isCompleted ? "bg-green-500" : "bg-neutral-200"
                      }`}
                    ></div>
                  )}
                </div>

                <div
                  className={`flex-1 pb-6 ${
                    index < phases.length - 1
                      ? "border-b border-neutral-100"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={`font-medium ${
                        isCompleted
                          ? "text-green-700"
                          : isCurrent
                          ? "text-blue-700"
                          : "text-neutral-500"
                      }`}
                    >
                      {phase.title}
                    </h4>
                    {isCompleted && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">
                    {phase.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderProgress;
