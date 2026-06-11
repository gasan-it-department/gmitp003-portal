import { Outlet } from "react-router";

// Bounded shell: children get a real `h-full` to anchor sticky elements
// (wizard header, side rails). Only the inner PDF area scrolls.
const DisseminationIndex = () => {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative">
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
};

export default DisseminationIndex;
