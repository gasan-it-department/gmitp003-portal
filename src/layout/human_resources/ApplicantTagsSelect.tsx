import {} from "react";
import ApplicantTags from "./item/ApplicantTags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
//

import {
  //officesTags,
  fieldTags,
  adminSupport,
  itRoles,
  creativeDesign,
  customerService,
  management,
  marketSales,
  educationTraining,
  humanResources,
  financeAccountng,
} from "@/utils/helper";
//icons
import {
  ShieldUser,
  Cpu,
  Component,
  Headset,
  Cog,
  BadgeDollarSign,
  GraduationCap,
  IdCardLanyard,
  Landmark,
  HardHat,
} from "lucide-react";

//

interface Props {
  handleAddTags: (tag: string, cont: string) => void;
  handleCheckTags: (tag: string) => {
    res: boolean;
    index: number;
  };
}

const ApplicantTagsSelect = ({ handleAddTags, handleCheckTags }: Props) => {
  const tabItems = [
    { value: "fields", label: "Fields", icon: HardHat },
    { value: "adminSupport", label: "Admin & Support", icon: ShieldUser },
    { value: "infoTech", label: "Information Tech", icon: Cpu },
    { value: "creativeDesign", label: "Creative & Design", icon: Component },
    { value: "customerService", label: "Customer Service", icon: Headset },
    { value: "management", label: "Management", icon: Cog },
    { value: "marketSales", label: "Market & Sales", icon: BadgeDollarSign },
    {
      value: "educationTraining",
      label: "Education & Training",
      icon: GraduationCap,
    },
    { value: "humanResources", label: "Human Resources", icon: IdCardLanyard },
    {
      value: "financeAccountng",
      label: "Finance & Accounting",
      icon: Landmark,
    },
  ];

  const tabContentMap = {
    fields: fieldTags,
    adminSupport: adminSupport,
    infoTech: itRoles,
    creativeDesign: creativeDesign,
    customerService: customerService,
    management: management,
    marketSales: marketSales,
    educationTraining: educationTraining,
    humanResources: humanResources,
    financeAccountng: financeAccountng,
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-auto">
      <Tabs
        className="w-full h-full flex flex-col"
        defaultValue="fields overflow-auto"
      >
        {/* Tabs Navigation - Scrollable */}
        <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 rounded-t-lg overflow-x-auto">
          <TabsList className="h-auto bg-transparent gap-1 p-2 overflow-x-auto flex-nowrap justify-start">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-8 px-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-blue-500 rounded-md text-xs text-gray-600 hover:text-gray-900 transition-all gap-1.5 whitespace-nowrap"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Tabs Content */}
        <div className="flex-1 overflow-auto p-3">
          {Object.entries(tabContentMap).map(([key, tags]) => (
            <TabsContent
              key={key}
              value={key}
              className="m-0 focus-visible:outline-none overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {tags.map((item, i) => (
                  <ApplicantTags
                    handleCheckTags={handleCheckTags}
                    key={item.tag}
                    item={item}
                    no={i + 1}
                    handleAddTags={handleAddTags}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};

export default ApplicantTagsSelect;
