import React, { useContext, createContext, useState } from "react";
import type { User } from "@/interface/data";
//
type UserProps = Pick<User, "id" | "username" | "lineId" | "departmentId">;

interface Props {
  user: UserProps | null;
  setUser: React.Dispatch<React.SetStateAction<UserProps | null>>;
  setlocalUser: (id: string) => string | null;
}
const UserContext = createContext<Props | null>(null);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProps | null>(null);

  const setlocalUser = (id: string) => {
    const user = localStorage.getItem(id);
    if (!user) {
      localStorage.setItem("user", id);
    }
    return user;
  };

  return (
    <UserContext.Provider value={{ user, setUser, setlocalUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("Context must be use only inside the Provider!");
  }
  return context;
};
