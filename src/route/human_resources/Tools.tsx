import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  IdCard,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface Tool {
  key: string;
  title: string;
  description: string;
  Icon: typeof IdCard;
  path?: string; // set = enabled
}

const TOOLS: Tool[] = [
  {
    key: "id-card",
    title: "ID Card Maker",
    description:
      "Design an ID template, drop in Full Name & Position placeholders, and print cards for plantilla or non-plantilla staff.",
    Icon: IdCard,
    path: "id-card",
  },
];

const Tools = () => {
  const nav = useNavigate();

  return (
    <div className="w-full h-full overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-600">
            <Wrench className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">HR Tools</h1>
            <p className="text-[11px] text-gray-500">
              Utilities for the HR office. Pick a tool to get started.
            </p>
          </div>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOOLS.map((t) => {
            const enabled = !!t.path;
            return (
              <button
                key={t.key}
                type="button"
                disabled={!enabled}
                onClick={() => enabled && nav(t.path as string)}
                className={
                  "text-left border rounded-xl bg-white p-4 transition-shadow " +
                  (enabled
                    ? "hover:shadow-md cursor-pointer"
                    : "opacity-60 cursor-not-allowed")
                }
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 flex-none">
                    <t.Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {t.title}
                      </h3>
                      {!enabled && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0"
                        >
                          Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                  {enabled && (
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-none mt-1" />
                  )}
                </div>
              </button>
            );
          })}

          {/* Hint for future tools */}
          <div className="border border-dashed rounded-xl p-4 flex items-center justify-center text-center">
            <p className="text-[11px] text-gray-400 inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              More tools coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
