import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type React from "react";
import { Button } from "../ui/button";

interface Props {
  title: string;
  children: React.ReactNode;
  onOpen: boolean;
  loading?: boolean;
  footer?: boolean;
  className: string;
  setOnOpen: () => void | Promise<void>;
  onFunction?: () => void | Promise<void>;
  showCloseButton?: boolean;
  yesTitle?: string;
}

const Modal = ({
  title,
  children,
  onOpen,
  loading,
  footer,
  className,
  setOnOpen,
  showCloseButton,
  yesTitle,
  onFunction,
}: Props) => {
  return (
    <Dialog open={onOpen} onOpenChange={setOnOpen}>
      <DialogContent
        showCloseButton={showCloseButton ?? false}
        className={className}
      >
        <DialogHeader>
          <DialogTitle className=" ">{title}</DialogTitle>
          <DialogDescription></DialogDescription>
          {children}
        </DialogHeader>
        {footer ? (
          <DialogFooter className=" w-full flex justify-end items-center">
            <Button variant="outline" onClick={setOnOpen} disabled={loading}>
              Close
            </Button>
            <Button disabled={loading} onClick={onFunction && onFunction}>
              {yesTitle ?? "Confirm"}
            </Button>
          </DialogFooter>
        ) : (
          <Button disabled={loading} variant="outline" onClick={setOnOpen}>
            Close
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
