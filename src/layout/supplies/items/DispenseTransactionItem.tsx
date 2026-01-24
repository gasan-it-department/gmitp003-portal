import { memo, useState } from "react";
import { useNavigate, NavLink } from "react-router";
//
import type { SupplyDispenseRecordProps } from "@/interface/data";
//
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
//
import { formatDate } from "@/utils/date";

//
interface Props {
  item: SupplyDispenseRecordProps;
  ref: (node?: Element | null | undefined) => void;
  onSelect?: (id: string) => void;
  multiSelect?: boolean;
  handleCheckItem?: (id: string) => boolean;
  handleSelectItem?: (id: string) => void;
}

const DispenseTransactionItem = ({
  item,
  ref,
  onSelect,
  multiSelect,
  handleCheckItem,
  handleSelectItem,
}: Props) => {
  const nav = useNavigate();
  const getRecipient = () => {
    let recipient = "";
    if (item.departmentId && item.unit) {
      recipient = item.unit.name;
    } else if (item.userId && item.user) {
      recipient = `${item.user.lastName}, ${item.user.firstName}`;
    } else {
      recipient = "N/A";
    }
    return recipient;
  };

  const getRecipientLink = () => {
    if (item.departmentId && item.unit) {
      return `transaction/${item.departmentId}/unit-record`;
    } else if (item.userId && item.user) {
      return `transaction/${item.userId}/user-record`;
    }
    return "#";
  };

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (multiSelect) {
      handleSelectItem?.(item.id);
      return;
    }
    // Check if the click came from a NavLink or its children
    const target = e.target as HTMLElement;
    const isNavLinkClick = target.closest("a[href]") !== null;

    if (!isNavLinkClick) {
      nav(`transaction/${item.id}`);
    }
  };

  const handleNavLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Stop the event from bubbling up to the row
    e.stopPropagation();
  };

  const dispensaryFullname = `${item.dispensary?.lastName || ""}, ${
    item.dispensary?.firstName || ""
  }`.trim();

  return (
    <TableRow
      onClick={handleRowClick}
      ref={ref}
      key={item.id}
      className="hover:bg-gray-100 dark:hover:bg-gray-800/30 cursor-pointer"
    >
      {multiSelect && (
        <TableCell>
          <Checkbox checked={handleCheckItem?.(item.id)} />
        </TableCell>
      )}
      <TableCell className="font-medium">
        <div className="text-sm">{formatDate(item.timestamp)}</div>
      </TableCell>
      <TableCell>
        <div className="max-w-[200px] truncate">{item.supply?.supply.item}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          ID: {item.id.slice(0, 8)}...
        </div>
      </TableCell>
      <TableCell className="text-right">
        <Badge variant="outline" className="font-semibold">
          {item.quantity}
        </Badge>
      </TableCell>
      <TableCell>
        <NavLink
          className="text-sm underline underline-offset-2 hover:text-blue-500"
          to={getRecipientLink()}
          onClick={handleNavLinkClick}
        >
          {getRecipient()}
        </NavLink>
      </TableCell>
      <TableCell>
        <div className="text-sm">{dispensaryFullname || "N/A"}</div>
      </TableCell>
      <TableCell>
        <div className="text-sm max-w-[200px] truncate" title={item.remarks}>
          {item.remarks || "-"}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs px-2 py-1">
          Completed
        </Badge>
      </TableCell>
    </TableRow>
  );
};

export default memo(DispenseTransactionItem);
