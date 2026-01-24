import { memo } from "react";
//
import Modal from "@/components/custom/Modal";

//
interface Props {
  children: React.ReactNode;
  showData: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  className?: string;
}

const ApplicationDataShow = ({
  children,
  showData,
  isOpen,
  setIsOpen,
  title,
  className = "max-w-4xl",
}: Props) => {
  return (
    <>
      {/* Clickable children that opens the modal */}
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {children}
      </div>

      <Modal
        title={title}
        children={<div className="p-4">{showData}</div>}
        onOpen={isOpen}
        className={className}
        setOnOpen={() => setIsOpen(false)}
        cancelTitle="Close"
      />
    </>
  );
};

export default memo(ApplicationDataShow);
