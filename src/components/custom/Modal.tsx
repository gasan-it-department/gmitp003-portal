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
  /**
   * A pinned action row, instead of the stock Cancel/Confirm pair.
   *
   * For modals that own their buttons. Putting them in `children` means
   * they scroll away with the content, which on a tall modal hides the
   * only way to finish — pass them here and they stay put.
   */
  actions?: React.ReactNode;
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
  actions,
}: Props) => {
  return (
    <Dialog open={onOpen} onOpenChange={setOnOpen}>
      {/*
        Height is capped in dvh, not vh: on a phone `100vh` is the viewport
        WITH the browser chrome scrolled away, so a vh-capped dialog is
        taller than the screen from the moment it opens.
      */}
      <DialogContent
        showCloseButton={showCloseButton ?? false}
        className={`flex flex-col max-h-[calc(100dvh-2rem)] overflow-hidden ${className}`}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg sm:text-xl">{title}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>

        {/*
          The body scrolls; the title and the buttons do not.

          `children` used to be a bare flex item here. A flex item defaults
          to min-height:auto, which means it refuses to shrink below its own
          content — so a tall modal grew straight past the cap above and the
          overflow was simply clipped, with nothing to scroll. Anything
          below the fold, including the buttons, was unreachable.

          min-h-0 is what lets it shrink; overflow-y-auto is what gives it
          the scrollbar. Both are needed — either alone does nothing.

          overflow-x-hidden is not decoration: setting only overflow-y makes
          overflow-x compute to auto, so a couple of stray pixels anywhere
          inside earns a horizontal scrollbar across the whole modal.
        */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>

        {actions ? (
          <DialogFooter className="shrink-0 w-full flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3">
            {actions}
          </DialogFooter>
        ) : footer === 1 ? null : footer ? (
          <DialogFooter className="shrink-0 w-full flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-6">
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
          <DialogFooter className="shrink-0 mt-4 sm:mt-6">
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
