import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
const MainHeader = () => {
  return (
    <div className=" w-full p-4 border border-x-0 border-t-0 bg-white flex justify-between">
      <p className=" font-medium text-2xl">Home</p>
      <Button
        size="sm"
        variant="outline"
        className=" hover:border-neutral-600 cursor-pointer block lg:hidden"
      >
        <Menu color="#222831" />
      </Button>
    </div>
  );
};

export default MainHeader;
