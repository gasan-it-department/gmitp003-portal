import { memo } from "react";
//
//
import type { Signature } from "@/interface/data";
interface Props {
  item: Signature;
}

const SignatureItems = ({ item }: Props) => {
  return <div>{item.id}</div>;
};

export default memo(SignatureItems);
