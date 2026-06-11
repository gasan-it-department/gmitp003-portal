import type { LucideProps } from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, NavLink } from "react-router";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";

interface ChildItem {
  title: string;
  path: string;
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  children: ChildItem[];
  accord: boolean;
}

interface Props extends ChildItem {
  lineId?: string;
  collapsed?: boolean;
}

// Strict path matching: match on URL **segments**, not substrings.
// e.g. `/abc/employee` is active for "employee" but not "ploye".
const matchesPath = (pathname: string, target: string) => {
  if (!target) return false;
  const cleaned = target.replace(/^\/+|\/+$/g, "");
  const segments = pathname.split("/").filter(Boolean);
  const targetSegments = cleaned.split("/").filter(Boolean);
  if (targetSegments.length === 0) return false;

  // Find target segments as a contiguous subsequence
  for (let i = 0; i <= segments.length - targetSegments.length; i++) {
    let matched = true;
    for (let j = 0; j < targetSegments.length; j++) {
      if (segments[i + j] !== targetSegments[j]) {
        matched = false;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
};

const SIdeBarItem = (props: Props) => {
  const { pathname } = useLocation();

  const isChildActive = useMemo(
    () => props.children.some((c) => matchesPath(pathname, c.path)),
    [pathname, props.children],
  );
  const isSelfActive = useMemo(
    () => matchesPath(pathname, props.path),
    [pathname, props.path],
  );

  // Accordion open state — auto-opens when a child is active
  const [open, setOpen] = useState(isChildActive);
  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  const Icon = props.Icon;

  // ── Accordion (parent with children) ────────────────────────────────
  if (props.accord && props.children.length > 0) {
    const trigger = (
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
          isChildActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-100"
        } ${props.collapsed ? "justify-center" : ""}`}
      >
        <Icon className="h-3.5 w-3.5 flex-shrink-0" />
        {!props.collapsed && (
          <>
            <span className="text-xs font-medium flex-1 truncate">
              {props.title}
            </span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                open ? "rotate-0" : "-rotate-90"
              } text-gray-400`}
            />
          </>
        )}
      </button>
    );

    return (
      <div>
        {props.collapsed ? (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>{trigger}</TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {props.title}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          trigger
        )}

        {/* Expanded children — hidden in collapsed mode */}
        {open && !props.collapsed && (
          <div className="mt-0.5 ml-3.5 border-l border-gray-200 pl-2 space-y-0.5">
            {props.children.map((child, i) => {
              const ChildIcon = child.Icon;
              const active = matchesPath(pathname, child.path);
              return (
                <NavLink
                  key={i}
                  to={child.path}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                    active
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <ChildIcon className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{child.title}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── Leaf nav link ───────────────────────────────────────────────────
  const link = (
    <NavLink
      to={props.path}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
        isSelfActive
          ? "bg-blue-100 text-blue-700 font-medium"
          : "text-gray-700 hover:bg-gray-100"
      } ${props.collapsed ? "justify-center" : ""}`}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      {!props.collapsed && (
        <span className="text-xs font-medium truncate">{props.title}</span>
      )}
    </NavLink>
  );

  if (!props.collapsed) return link;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {props.title}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SIdeBarItem;
