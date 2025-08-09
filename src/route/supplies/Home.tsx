//libs
import { useEffect } from "react";
import { Outlet } from "react-router";
//

//icons
import { Boxes } from "lucide-react";

//

const Home = () => {
  useEffect(() => {
    const main = () => {
      window.document.title = "Inventory";
    };
    main();
  }, []);

  return (
    <div className=" w-full h-screen bg-neutral-100">
      <div className="w-full h-[10%] p-2 lg:px-12 flex items-center gap-2.5">
        <p className=" font-medium text-2xl text-neutral-700 flex">
          <Boxes size={40} />
        </p>
        <p className=" font-medium text-2xl text-neutral-700 flex">Inventory</p>
      </div>
      <div className="w-full h-[90%] p-2">
        <div className=" w-full h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Home;
