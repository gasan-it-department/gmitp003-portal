import { createContext, useState } from "react";
import { useNavigate } from "react-router";

import Modal from "@/components/custom/Modal";
import { Button } from "@/components/ui/button";

const AuthorizationContext = createContext(null);
const Unauthorized = ({ children }: { children: React.ReactNode }) => {
  const [onOpen, setOnOpen] = useState(false);

  const nav = useNavigate();

  const handleLogut = () => {
    nav("/auth");
  };
  // useEffect(() => {
  //   const interceptor = axios.interceptors.response.use(
  //     (response) => response,
  //     (error) => {
  //       if (error.response?.status === 401) {
  //         removeCookie("auth_token");
  //         setOnOpen(true);
  //         return Promise.reject(error);
  //       }
  //       return Promise.reject(error);
  //     }
  //   );
  //   return () => {
  //     axios.interceptors.response.eject(interceptor);
  //   };
  // }, []);

  return (
    <AuthorizationContext.Provider value={null}>
      {children}
      <Modal
        title={"Authentication Expired"}
        children={
          <div>
            <Button onClick={handleLogut}>Go to Login</Button>
          </div>
        }
        onOpen={onOpen}
        className={""}
        setOnOpen={() => setOnOpen(false)}
      />
    </AuthorizationContext.Provider>
  );
};

export default Unauthorized;
