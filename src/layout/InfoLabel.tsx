import { twMerge } from "tailwind-merge";

interface Props {
  className: string;
  label: string;
  value: string;
  colSpan?: number;
}

const InfoLabel = ({ className, label, value, colSpan = 5 }: Props) => {
  return (
    <section
      className={twMerge(` w-full grid p-1 grid-cols-${colSpan}`, className)}
    >
      <p>{label}</p>
      <p>:</p>
      <p>{value}</p>
    </section>
  );
};

export default InfoLabel;
