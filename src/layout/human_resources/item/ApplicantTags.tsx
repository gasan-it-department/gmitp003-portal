import { memo } from "react";

//props and interface
interface Props {
  item: { tag: string; cont: string };
  no: number;
  handleAddTags: (tag: string, cont: string) => void;
  handleCheckTags: (tag: string) => {
    res: boolean;
    index: number;
  };
}

const ApplicantTags = ({ item, no, handleAddTags, handleCheckTags }: Props) => {
  return (
    <div
      className={` w-auto px-2 py-1 border ${
        handleCheckTags(item.tag).res
          ? "border-green-500 bg-neutral-300"
          : "border-neutral-400 bg-neutral-100"
      }   rounded  cursor-pointer hover:bg-neutral-200`}
      onClick={() => handleAddTags(item.tag, item.cont)}
    >
      <p className=" font-medium">
        {no}. {item.cont}
      </p>
    </div>
  );
};

export default memo(ApplicantTags);
