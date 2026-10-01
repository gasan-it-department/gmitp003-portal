import { useEffect } from "react";
import { Outlet } from "react-router";

/**
 * The Inventory module shell.
 *
 * Deliberately nothing but a frame. It used to add `h-screen` inside an
 * already-constrained parent and then 8px of padding around every child,
 * which is why no Inventory screen could sit flush the way the HR screens
 * do — each one was floating in a border it did not ask for, and each one
 * compensated differently. The screens own their own spacing now.
 */
const Home = () => {
  useEffect(() => {
    window.document.title = "Inventory";
  }, []);

  return (
    <div className="w-full h-full min-h-0 overflow-hidden">
      <Outlet />
    </div>
  );
};

export default Home;
