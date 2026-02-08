//interface and props
import { type EligibilityProps } from "@/interface/data";

interface Props {
  item: EligibilityProps;
  no: number;
}
const EligibityItem = ({ item }: Props) => {
  return (
    <div className=" w-full p-2 border bg-white">
      <p>{item.title}</p>
    </div>
  );
};

export default EligibityItem;
