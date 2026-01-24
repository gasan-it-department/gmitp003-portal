import { memo } from "react";

//interfaces and Props
interface Props {
  handleRemoveTag: (index: number) => void;
  item: { tag: string; cont: string };
  no: number;
}

const ApplicantTaggedItem = ({ handleRemoveTag, item, no }: Props) => {
  return (
    <button
      className=" border border-neutral-300 p-2 bg-white rounded cursor-pointer hover:bg-neutral-200 hover:border-green-500 hover:text-neutral-700"
      onClick={(e) => {
        e.preventDefault();
        handleRemoveTag(no);
      }}
    >
      <p className=" truncate text-neutral-700">{item.cont}</p>
    </button>
  );
};

export default memo(ApplicantTaggedItem);
