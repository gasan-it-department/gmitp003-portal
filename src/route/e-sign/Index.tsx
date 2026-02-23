//
import { Outlet } from "react-router";

//interface

const Index = () => {
  return (
    <div className=" w-full h-screen bg-neutral-100">
      <div className=" w-full h-full">
        <Outlet />
      </div>
    </div>
  );
};

export default Index;
