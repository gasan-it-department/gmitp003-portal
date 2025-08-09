import type { LucideProps } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
//
interface Props {
  title: string;
  path: string;
  Icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  children: Props[];
  accord: boolean;
}

const SIdeBarItem = ({ ...props }: Props) => {
  const location = useLocation();
  const [onView, setOnView] = useState("");
  const { pathname } = location;

  useEffect(() => {
    setOnView(pathname);
  }, [pathname]);

  const selectedIndicator = (path: string) => onView.includes(path);

  const nav = useNavigate();

  const handleNav = (path: string) => {
    nav(path);
  };

  if (props.accord) {
    return (
      <Accordion type="single" collapsible>
        <AccordionItem
          className={` w-full rounded-md hover:bg-gray-100 cursor-pointer `}
          value={props.path}
        >
          <AccordionTrigger>{props.title}</AccordionTrigger>
          <AccordionContent>
            {props.children.map((item) => (
              <div
                className={` w-full p-2 flex gap-2 items-center rounded-md ${
                  selectedIndicator(item.path) ? "bg-gray-100" : ""
                } hover:bg-gray-100 cursor-pointer `}
                onClick={() => handleNav(item.path)}
              >
                <item.Icon size={18} color={"#292929"} />
                <p
                  className={` text-sm ${
                    selectedIndicator(item.path)
                      ? "font-medium text-black"
                      : ` text-[#292929]`
                  } `}
                >
                  {item.title}
                </p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }
  return (
    <div
      className={` w-full p-2 flex gap-2 items-center rounded-md ${
        selectedIndicator(props.path) ? "bg-gray-100" : ""
      } hover:bg-gray-100 cursor-pointer `}
      onClick={() => handleNav(props.path)}
    >
      <props.Icon size={18} color={"#292929"} />
      <p
        className={` text-sm ${
          selectedIndicator(props.path)
            ? "font-medium text-black"
            : ` text-[#292929]`
        } `}
      >
        {props.title}
      </p>
    </div>
  );
};

export default SIdeBarItem;
