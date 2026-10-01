/**
 * The module page shell, taken from the HR module.
 *
 * HR reads tighter than the rest of the portal for reasons that are easy to
 * miss and easy to lose: a 12px icon next to a 12px title, a toolbar that is
 * 8px of padding rather than 24px, one scroll container instead of three,
 * and a type scale with exactly two sizes — 10px for labels and 12px for
 * content. Nothing is bold except what you are meant to read first.
 *
 * Those rules were inlined in every HR screen, which is why Inventory drifted:
 * there was nothing to import, only something to imitate. These components are
 * that something. Inventory uses them, HR can adopt them, and the desktop app
 * compiles the very same files — so the three cannot disagree.
 */
import type { LucideIcon } from "lucide-react";

/** The page itself. One scroll container lives inside it, never two. */
export const PageShell = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`w-full h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

/**
 * The strip across the top: what this screen is, then its controls.
 *
 * Deliberately not a hero. A 24px bold title on a working screen spends the
 * reader's attention on a word they already knew — they clicked the thing to
 * get here. The controls are what they came for, so the controls get the room.
 */
export const Toolbar = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) => (
  <div className="px-3 py-2 bg-white border-b flex items-center gap-2 flex-wrap shrink-0">
    <div className="flex items-center gap-1.5 flex-shrink-0">
      {Icon ? <Icon className="h-3 w-3 text-blue-500" /> : null}
      <div className="leading-tight">
        <h3 className="text-xs font-semibold text-gray-800">{title}</h3>
        {subtitle ? (
          <p className="text-[10px] text-gray-500 leading-none mt-0.5">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
    {children}
  </div>
);

/** Pushes whatever follows it to the right of the toolbar. */
export const ToolbarSpacer = () => <div className="flex-1 min-w-[120px]" />;

/** The area under the toolbar. `min-h-0` is what lets the panel scroll. */
export const PageBody = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex-1 min-h-0 p-3 ${className}`}>{children}</div>
);

/** A white card that fills its space and scrolls inside, not outside. */
export const Panel = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`w-full h-full flex flex-col border rounded-lg bg-white overflow-hidden ${className}`}
  >
    {children}
  </div>
);

/** The scrolling part of a Panel. */
export const PanelBody = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex-1 overflow-auto ${className}`}>{children}</div>
);

/**
 * A column heading. Exported as a class rather than a component so it can go
 * straight onto a <TableHead> without wrapping every cell in a div.
 */
export const TH =
  "text-[10px] font-semibold text-gray-700 uppercase px-3 py-2 whitespace-nowrap";

/** A body cell, at the same rhythm as TH. */
export const TD = "px-3 py-2 text-xs text-gray-700";

/** The sticky header row of a table inside a Panel. */
export const THEAD = "bg-gray-100 sticky top-0 z-10";

/**
 * Nothing here yet.
 *
 * Says what would be here and how to put it there, because "No data" tells
 * somebody they are stuck without telling them they are not.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center max-w-xs space-y-2">
      {Icon ? (
        <div className="mx-auto h-9 w-9 rounded-full bg-gray-100 border flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-400" />
        </div>
      ) : null}
      <p className="text-xs font-semibold text-gray-700">{title}</p>
      {hint ? (
        <p className="text-[10px] text-gray-500 leading-relaxed">{hint}</p>
      ) : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  </div>
);

/**
 * The line under a finished list.
 *
 * HR ends every list with the total rather than leaving the reader to count
 * rows, and it is the one place a number is worth stating plainly.
 */
export const ListFooter = ({
  total,
  noun,
  children,
}: {
  total: number;
  noun: string;
  children?: React.ReactNode;
}) => (
  <div className="px-3 py-2 border-t bg-gray-50 flex items-center justify-between shrink-0">
    <span className="text-[10px] text-gray-500">
      Total:{" "}
      <span className="font-semibold text-gray-700 tabular-nums">{total}</span>{" "}
      {noun}
      {total === 1 ? "" : "s"}
    </span>
    {children}
  </div>
);
