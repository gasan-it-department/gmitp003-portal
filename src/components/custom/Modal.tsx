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
  title: React.ReactNode;
  children: React.ReactNode;
  onOpen: boolean;
  loading?: boolean;
  footer?: boolean | number;
  className: string;
  setOnOpen: () => void | Promise<void>;
  onFunction?: () => void | Promise<void>;
  showCloseButton?: boolean;
  yesTitle?: string;
  cancelTitle?: string;
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
  cancelTitle,
}: Props) => {
  return (
    <Dialog open={onOpen} onOpenChange={setOnOpen}>
      <DialogContent
        showCloseButton={showCloseButton ?? false}
        className={`flex flex-col max-h-[calc(100vh-2rem)] ${className}`}
      >
        <DialogHeader>
          <DialogTitle className=" ">{title}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        {children}
        {footer === 1 ? null : footer ? (
          <DialogFooter className=" w-full flex justify-end items-center">
            <Button variant="outline" onClick={setOnOpen} disabled={loading}>
              Cancel
            </Button>
            <Button disabled={loading} onClick={onFunction && onFunction}>
              {yesTitle ?? "Confirm"}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button disabled={loading} variant="outline" onClick={setOnOpen}>
              {cancelTitle ?? "Cancel"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
