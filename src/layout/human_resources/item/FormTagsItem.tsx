import { memo } from "react";
import { Check } from "lucide-react";

interface Props {
  item: { tag: string; cont: string };
  no: number;
  handleAddTags: (tag: string, cont: string) => void;
  handleCheckTags: (tag: string) => {
    res: boolean;
    index: number;
  };
}

const FormTagsItem = ({ item, handleAddTags, handleCheckTags }: Props) => {
  const isSelected = handleCheckTags(item.tag).res;

  return (
    <button
      type="button"
      onClick={() => handleAddTags(item.tag, item.cont)}
      title={item.cont}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs whitespace-nowrap transition-colors ${
        isSelected
          ? "border-green-500 bg-green-50 text-green-700 font-medium"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
      }`}
    >
      {isSelected && <Check className="w-3 h-3 text-green-600 flex-shrink-0" />}
      <span className="truncate max-w-[200px]">{item.cont}</span>
    </button>
  );
};

export default memo(FormTagsItem);
