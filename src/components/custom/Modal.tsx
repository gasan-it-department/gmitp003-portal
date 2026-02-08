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
          <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        {children}

        {footer === 1 ? null : footer ? (
          <DialogFooter className="w-full flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
            <Button
              variant="outline"
              onClick={setOnOpen}
              disabled={loading}
              className="flex-1 sm:flex-none order-2 sm:order-1"
              size="sm"
            >
              {cancelTitle ?? "Cancel"}
            </Button>
            <Button
              disabled={loading}
              onClick={onFunction && onFunction}
              className="flex-1 sm:flex-none order-1 sm:order-2"
              size="sm"
            >
              {yesTitle ?? "Confirm"}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className="mt-4 sm:mt-6">
            <Button
              disabled={loading}
              variant="outline"
              onClick={setOnOpen}
              className="w-full sm:w-auto"
              size="sm"
            >
              {cancelTitle ?? "Cancel"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
