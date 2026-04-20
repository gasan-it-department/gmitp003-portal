import { createContext, useContext } from "react";
import type { LineProps } from "@/interface/data";

interface Props {
  line: LineProps | undefined;
}

export const LineContext = createContext<Props>({
  line: undefined,
});

const useLine = () => {
  const context = useContext(LineContext);

  if (!context) {
    throw new Error("useLine only accessible inside the provider");
  }
  return context;
};

export default useLine;
