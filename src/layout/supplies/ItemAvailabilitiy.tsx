import {} from "react";

//
import { Button } from "@/components/ui/button";

//

import { SearchCheck } from "lucide-react";
const ItemAvailabilitiy = () => {
  return (
    <div className=" w-full">
      <div className=" w-full ">
        <Button variant="outline" className=" cursor-pointer mt-2">
          <SearchCheck />
          Check Availability
        </Button>
      </div>
    </div>
  );
};

export default ItemAvailabilitiy;
