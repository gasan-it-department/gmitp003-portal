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
  return (
    <div className=" w-full  overflow-auto overflow-x-auto">
      <Tabs className=" w-full" defaultValue="fields">
        <TabsList className=" overflow-x-auto">
          <TabsTrigger value="fields">
            <HardHat color={iconMainColor} />
            Fields
          </TabsTrigger>
          <TabsTrigger value="adminSupport">
            <ShieldUser color={iconMainColor} />
            Administrative & Support Roles
          </TabsTrigger>
          <TabsTrigger value="infoTech">
            <Cpu color={iconMainColor} />
            Info. Tech
          </TabsTrigger>
          <TabsTrigger value="creativeDesign">
            <Component color={iconMainColor} />
            Creative & Design
          </TabsTrigger>
          <TabsTrigger value="customerService">
            <Headset color={iconMainColor} /> Customer Service
          </TabsTrigger>
          <TabsTrigger value="management">
            <Cog color={iconMainColor} />
            Management
          </TabsTrigger>
          <TabsTrigger value="marketSales">
            <BadgeDollarSign color={iconMainColor} /> Market Sales
          </TabsTrigger>
          <TabsTrigger value="educationTraining">
            <GraduationCap color={iconMainColor} />
            Education and Training
          </TabsTrigger>

          <TabsTrigger value="humanResources">
            <IdCardLanyard color={iconMainColor} />
            Human Resources
          </TabsTrigger>
          <TabsTrigger value="financeAccountng">
            <Landmark color={iconMainColor} />
            Finance & Accounting
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fields" className="grid grid-cols-2 gap-2">
          {fieldTags.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>
        <TabsContent value="adminSupport" className="grid grid-cols-2 gap-2">
          {adminSupport.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>

        <TabsContent value="infoTech" className="grid grid-cols-2 gap-2">
          {itRoles.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>

        <TabsContent value="creativeDesign" className="grid grid-cols-2 gap-2">
          {creativeDesign.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>

        <TabsContent value="customerService" className="grid grid-cols-2 gap-2">
          {customerService.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>

        <TabsContent value="management" className="grid grid-cols-2 gap-2">
          {management.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>

        <TabsContent value="marketSales" className="grid grid-cols-2 gap-2">
          {marketSales.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>

        <TabsContent
          value="educationTraining"
          className="grid grid-cols-2 gap-2"
        >
          {educationTraining.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>

        <TabsContent value="humanResources" className="grid grid-cols-2 gap-2">
          {humanResources.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>

        <TabsContent
          value="financeAccountng"
          className="grid grid-cols-2 gap-2"
        >
          {financeAccountng.map((item, i) => (
            <ApplicantTags
              handleCheckTags={handleCheckTags}
              key={item.tag}
              item={item}
              no={i + 1}
              handleAddTags={handleAddTags}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicantTagsSelect;
