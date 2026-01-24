import { useState, useMemo } from "react";
import FormTagsItem from "./human_resources/item/FormTagsItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
//

import {
  officesTags,
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
import { iconMainColor } from "@/utils/helper";
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
  Search,
  X,
  Filter,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("fields");

  // Combine all tags for search
  const allTags = useMemo(
    () => [
      ...fieldTags.map((item) => ({ ...item, category: "Fields" })),
      ...adminSupport.map((item) => ({
        ...item,
        category: "Administrative & Support Roles",
      })),
      ...itRoles.map((item) => ({ ...item, category: "Info. Tech" })),
      ...creativeDesign.map((item) => ({
        ...item,
        category: "Creative & Design",
      })),
      ...customerService.map((item) => ({
        ...item,
        category: "Customer Service",
      })),
      ...management.map((item) => ({ ...item, category: "Management" })),
      ...marketSales.map((item) => ({ ...item, category: "Market Sales" })),
      ...educationTraining.map((item) => ({
        ...item,
        category: "Education and Training",
      })),
      ...humanResources.map((item) => ({
        ...item,
        category: "Human Resources",
      })),
      ...financeAccountng.map((item) => ({
        ...item,
        category: "Finance & Accounting",
      })),
    ],
    []
  );

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return null;

    return allTags.filter(
      (item) =>
        item.cont.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allTags]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Fields: <HardHat className="w-4 h-4" />,
      "Administrative & Support Roles": <ShieldUser className="w-4 h-4" />,
      "Info. Tech": <Cpu className="w-4 h-4" />,
      "Creative & Design": <Component className="w-4 h-4" />,
      "Customer Service": <Headset className="w-4 h-4" />,
      Management: <Cog className="w-4 h-4" />,
      "Market Sales": <BadgeDollarSign className="w-4 h-4" />,
      "Education and Training": <GraduationCap className="w-4 h-4" />,
      "Human Resources": <IdCardLanyard className="w-4 h-4" />,
      "Finance & Accounting": <Landmark className="w-4 h-4" />,
    };
    return icons[category] || <Filter className="w-4 h-4" />;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Search Header */}
      <div className="p-4 border-b bg-white sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search skills, roles, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Count */}
        {filteredTags && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {filteredTags.length} result
                {filteredTags.length !== 1 ? "s" : ""} found
              </Badge>
              <span className="text-sm text-gray-500">for "{searchQuery}"</span>
            </div>
            <button
              onClick={clearSearch}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {filteredTags ? (
          // Search Results View
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {/* Group results by category */}
              {Object.entries(
                filteredTags.reduce((acc, item) => {
                  if (!acc[item.category]) acc[item.category] = [];
                  acc[item.category].push(item);
                  return acc;
                }, {} as { [key: string]: typeof filteredTags })
              ).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    {getCategoryIcon(category)}
                    <h3 className="font-semibold text-sm text-gray-700">
                      {category}
                    </h3>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                    {items.map((item, i) => (
                      <FormTagsItem
                        handleCheckTags={handleCheckTags}
                        key={`${item.tag}-${i}`}
                        item={item}
                        no={i + 1}
                        handleAddTags={handleAddTags}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        ) : (
          // Normal Tabs View
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full h-full flex flex-col"
          >
            <div className="border-b">
              <ScrollArea className="w-full">
                <TabsList className="w-full justify-start h-12 px-4">
                  <TabsTrigger
                    value="fields"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <HardHat className="w-4 h-4" />
                    Fields
                  </TabsTrigger>
                  <TabsTrigger
                    value="adminSupport"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <ShieldUser className="w-4 h-4" />
                    Admin & Support
                  </TabsTrigger>
                  <TabsTrigger
                    value="infoTech"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Cpu className="w-4 h-4" />
                    IT
                  </TabsTrigger>
                  <TabsTrigger
                    value="creativeDesign"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Component className="w-4 h-4" />
                    Creative
                  </TabsTrigger>
                  <TabsTrigger
                    value="customerService"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Headset className="w-4 h-4" />
                    Customer Service
                  </TabsTrigger>
                  <TabsTrigger
                    value="management"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Cog className="w-4 h-4" />
                    Management
                  </TabsTrigger>
                  <TabsTrigger
                    value="marketSales"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <BadgeDollarSign className="w-4 h-4" />
                    Sales
                  </TabsTrigger>
                  <TabsTrigger
                    value="educationTraining"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Education
                  </TabsTrigger>
                  <TabsTrigger
                    value="humanResources"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <IdCardLanyard className="w-4 h-4" />
                    HR
                  </TabsTrigger>
                  <TabsTrigger
                    value="financeAccountng"
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <Landmark className="w-4 h-4" />
                    Finance
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>

            <div className="flex-1 overflow-auto">
              <TabsContent value="fields" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {fieldTags.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="adminSupport" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adminSupport.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="infoTech" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {itRoles.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="creativeDesign" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {creativeDesign.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="customerService" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerService.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="management" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {management.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="marketSales" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {marketSales.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="educationTraining" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {educationTraining.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="humanResources" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {humanResources.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="financeAccountng" className="h-full p-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {financeAccountng.map((item, i) => (
                    <FormTagsItem
                      handleCheckTags={handleCheckTags}
                      key={item.tag}
                      item={item}
                      no={i + 1}
                      handleAddTags={handleAddTags}
                    />
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default ApplicantTagsSelect;
