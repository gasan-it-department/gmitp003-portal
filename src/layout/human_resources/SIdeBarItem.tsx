import type { LucideProps } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, NavLink } from "react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight } from "lucide-react";

interface Props {
  title: string;
  path: string;
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  children: Props[];
  accord: boolean;
  lineId?: string;
}

const SIdeBarItem = ({ ...props }: Props) => {
  const location = useLocation();
  const [onView, setOnView] = useState("");
  const { pathname } = location;
  const nav = useNavigate();

  useEffect(() => {
    setOnView(pathname);
  }, [pathname]);

  const isActive = (path: string) => onView.includes(path);
  const isParentActive = props.children.some((child) => isActive(child.path));

  const handleNav = (path: string) => {
    nav(`${path}`);
  };

  if (props.accord) {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value={props.path} className="border-none">
          <AccordionTrigger
            className={`
            flex items-center w-full p-3 rounded-lg text-left transition-all duration-200
            hover:bg-blue-50 hover:text-blue-700
            ${
              isParentActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:text-gray-900"
            }
          `}
          >
            <div className="flex items-center gap-3 flex-1">
              <props.Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{props.title}</span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-2 pb-1">
            <div className="space-y-1 ml-3 border-l border-gray-200 pl-3">
              {props.children.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNav(item.path)}
                  className={`
                    w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all duration-200
                    ${
                      isActive(item.path)
                        ? "bg-blue-100 text-blue-700 font-medium border-l-2 border-blue-500 -ml-0.5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  <item.Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <NavLink
      to={props.path}
      onClick={() => handleNav(props.path)}
      className={({ isActive }) => `
        w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200
        ${
          isActive
            ? "bg-blue-100 text-blue-700 font-medium shadow-sm"
            : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
        }
      `}
    >
      <props.Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium text-sm">{props.title}</span>
      {isActive(props.path) && (
        <ChevronRight className="w-4 h-4 ml-auto text-blue-500" />
      )}
    </NavLink>
  );
};

export default SIdeBarItem;
