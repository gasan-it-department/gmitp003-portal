//libs
import { useEffect } from "react";
import { Outlet } from "react-router";
//

//icons
// import { Boxes } from "lucide-react";

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
      <div className="w-full h-full p-2">
        <div className=" w-full h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Home;
