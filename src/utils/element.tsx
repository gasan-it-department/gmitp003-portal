import { TableHead } from "@/components/ui/table";
import { ListChecks, OctagonAlert } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
export const searchedChar = (
  query: string,
  value: string | undefined | null
) => {
  if (!value) return null; // Handle undefined/null value
  if (!query) return value; // Return original value if query is empty

  const parts = value.trim().split(new RegExp(`(${query})`, "gi"));

  const element = parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <span key={index} className="font-bold text-orange-600">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });

  return element;
};
const headerClass = "text-white";
export const timebaseHeader = (opt: string) => {
  switch (opt) {
    case "Quaterly":
      return [
        <TableHead className={headerClass}>Jan. - March.</TableHead>,
        <TableHead className={headerClass}>Apr. - Jun.</TableHead>,
        <TableHead className={headerClass}>Jul. - Sept.</TableHead>,
        <TableHead className={headerClass}>Oct. - Dec.</TableHead>,
      ];
    case "Semi-Annual":
      return [
        <TableHead className={headerClass}>Jan. - Jun.</TableHead>,
        <TableHead className={headerClass}>July. - Dec.</TableHead>,
      ];
    case "Annually":
      return [
        <TableHead className={headerClass}>1st</TableHead>,
        <TableHead className={headerClass}>2nd</TableHead>,
        <TableHead className={headerClass}>3rd</TableHead>,
      ];
    default:
      return [
        <TableHead className={headerClass}>Jan. - March.</TableHead>,
        <TableHead className={headerClass}>Apr. - Jun.</TableHead>,
        <TableHead className={headerClass}>Jul. - Sept.</TableHead>,
        <TableHead className={headerClass}>Oct. - Dec.</TableHead>,
      ];
  }
};

export const inboxTypeIcon = [
  <ListChecks size={30} color="#37353E" />,
  <OctagonAlert />,
];

export const BreadCumbList = () => {
  return (
    <Breadcrumb>
      <BreadCumbList></BreadCumbList>
    </Breadcrumb>
  );
};

export const AddExistPositionProgress = ({ index }: { index: number }) => {
  return (
    <div className=" w-full flex justify-between items-center">
      <div
        className={` rounded-full text-center ${
          index >= 1 ? "text-green-500" : ""
        }`}
      >
        <p className=" text-sm font-bold text-neutral-600">1</p>
        <p className=" text-xs p-2 font-medium">
          Select <br /> Position
        </p>
      </div>
      <span className={`w-full h-2 ${index >= 1 ? "bg-green-400" : ""}`}></span>
      <div
        className={` rounded-full text-center ${
          index >= 2 ? "text-green-500" : ""
        }`}
      >
        <p className=" text-sm font-bold text-neutral-600">2</p>
        <p className=" text-xs p-2 font-medium">Setup</p>
      </div>

      <span className={`w-full h-2 ${index >= 2 ? "bg-green-400" : ""}`}></span>
      <div
        className={` rounded-full text-center ${
          index >= 2 ? "text-green-500" : ""
        }`}
      >
        <p className=" text-sm font-bold text-neutral-600">3</p>
        <p className=" text-xs p-2 font-medium">Confirm</p>
      </div>
    </div>
  );
};

export const ApplicationStatusProgress = ({ index }: { index: number }) => {
  return (
    <div className="w-full flex justify-between items-center">
      {/* Step 1: Pending */}
      <div className="flex flex-col items-center flex-1">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            index >= 1
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 bg-white text-gray-400"
          }`}
        >
          <span className="text-sm font-bold">1</span>
        </div>
        <p
          className={`text-xs mt-2 font-medium text-center ${
            index >= 1 ? "text-green-600" : "text-gray-500"
          }`}
        >
          Pending
        </p>
      </div>

      {/* Connector line 1 */}
      <div
        className={`flex-1 h-1 mx-1 ${
          index >= 2 ? "bg-green-400" : "bg-gray-300"
        }`}
      ></div>

      {/* Step 2: For Interview */}
      <div className="flex flex-col items-center flex-1">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            index >= 2
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 bg-white text-gray-400"
          }`}
        >
          <span className="text-sm font-bold">2</span>
        </div>
        <p
          className={`text-xs mt-2 font-medium text-center ${
            index >= 2 ? "text-green-600" : "text-gray-500"
          }`}
        >
          For Interview
        </p>
      </div>

      {/* Connector line 2 */}
      <div
        className={`flex-1 h-1 mx-1 ${
          index >= 3 ? "bg-green-400" : "bg-gray-300"
        }`}
      ></div>

      {/* Step 3: Concluded */}
      <div className="flex flex-col items-center flex-1">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            index >= 3
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 bg-white text-gray-400"
          }`}
        >
          <span className="text-sm font-bold">3</span>
        </div>
        <p
          className={`text-xs mt-2 font-medium text-center ${
            index >= 3 ? "text-green-600" : "text-gray-500"
          }`}
        >
          Concluded
        </p>
      </div>
    </div>
  );
};
