import { Bell } from "lucide-react";

const Header = () => {
  return (
    <div className=" w-full h-full bg-white flex justify-between items-center border border-x-0 border-t-0 border-b">
      <div></div>
      <div className=" p-2 border hover:border-gray-300 mr-4 rounded cursor-pointer">
        <Bell size={24} color="#292929" strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default Header;
