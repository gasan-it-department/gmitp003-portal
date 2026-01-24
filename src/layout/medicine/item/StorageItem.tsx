import { memo } from "react";
import { useNavigate } from "react-router";
//
import type { MedicineStorage } from "@/interface/data";

interface Props {
  item: MedicineStorage;
}

const StorageItem = ({ item }: Props) => {
  const nav = useNavigate();
  return (
    <button
      className=" bg-white p-2 border border-neutral-300 hover:bg-neutral-200 cursor-pointer shadow"
      onClick={() => nav(`storage/${item.id}`)}
    >
      <p className=" font-medium text-neutral-700">{item.name}</p>
      <p className=" text-sm">{item.refNumber}</p>
    </button>
  );
};

export default memo(StorageItem);
