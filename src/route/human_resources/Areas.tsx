import { useSearchParams } from "react-router";

//layout and Components
import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import Regions from "@/layout/Region";
import Provinces from "@/layout/Province";
import Municipalities from "@/layout/Municipalities";
import Barangay from "@/layout/Barangay";
const Areas = () => {
  const [params, setParams] = useSearchParams({
    area: "region",
  });

  const currentType = params.get("area") || "region";

  const handleChangeParams = (key: string, value: string) => {
    setParams(
      (prev) => {
        prev.set(key, value);
        return prev;
      },
      {
        replace: true,
      }
    );
  };

  // const renderArea = () => {
  //   if (currentType === "region") {
  //     return <Regions selectComp={false} />;
  //   }
  //   if (currentType === "province") {
  //     return <Regions selectComp={false} />;
  //   }
  //   if (currentType === "municipalities") {
  //     return <Regions selectComp={false} />;
  //   }
  //   if (currentType === "barangay") {
  //     return <Regions selectComp={false} />;
  //   }
  // };
  return (
    <div>
      <div className=" w-full p-2 bg-white">
        <Select
          defaultValue={currentType}
          onValueChange={(e) => handleChangeParams("area", e)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Area" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="region">Region</SelectItem>
            <SelectItem value="province">Province</SelectItem>
            <SelectItem value="municipalities">Municipalities</SelectItem>
            <SelectItem value="barangay">Barangay</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* <div>{renderArea()}</div> */}
    </div>
  );
};

export default Areas;
