import { useState } from "react";
import { useAuth } from "@/provider/ProtectedRoute";
//
//
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import Modal from "@/components/custom/Modal";
import AddEditUnit from "@/layout/human_resources/AddEditUnit";
//
import { offices } from "@/data/mock";
import { FolderPlus, Pencil, Trash } from "lucide-react";

const Department = () => {
  const [selected, setSelected] = useState<{
    id: string;
    title: string;
    option: number;
  } | null>(null);
  const [onOpen, setOnOpen] = useState(0);
  const nav = useNavigate();
  const auth = useAuth();
  const handelChangeParams = () => {};

  const handelSelected = (id: string, title: string, option: number) => {
    if (selected?.id === id) {
      setSelected({ id: "", title: "", option: 0 });
      return;
    }
    setSelected({ id, title, option });
  };
  return (
    <div className=" w-full h-full">
      <ScrollArea className=" w-full h-full overflow-auto">
        <div className=" w-full bg-white p-2 flex justify-end ">
          <Button
            size="sm"
            className=" text-sm mr-4"
            onClick={() => setOnOpen(1)}
          >
            <FolderPlus strokeWidth={1.5} />
            Create
          </Button>
        </div>
        <Table className=" w-full h-full">
          <TableHeader className=" bg-white">
            <TableHead>Unit/s</TableHead>
            <TableHead>Personnel/Members</TableHead>
          </TableHeader>

          <TableBody>
            {offices.map((item) => (
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <TableRow
                    onClick={() => nav(`office/${item.id}`)}
                    key={item.id}
                    className=" cursor-pointer hover:bg-white"
                  >
                    <TableCell>{item.title}</TableCell>
                    <TableCell>1</TableCell>
                  </TableRow>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    onClick={() => handelSelected(item.id, item.title, 1)}
                  >
                    <Pencil color="#292929" strokeWidth={1.5} />
                    Edit
                  </ContextMenuItem>
                  <ContextMenuItem className=" text-red-500 hover:text-red-600">
                    <Trash color="red" strokeWidth={1.5} />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <Modal
        title={selected?.title ?? "Closing..."}
        children={undefined}
        onOpen={selected?.id ? true : false}
        className={""}
        setOnOpen={() => {
          setSelected(null);
        }}
      />

      <Modal
        title={"Add Unit"}
        children={
          <AddEditUnit
            existed={false}
            id={undefined}
            title={undefined}
            token={auth.token}
          />
        }
        onOpen={onOpen === 1}
        className={" min-w-2xl"}
        setOnOpen={() => {
          setOnOpen(0);
        }}
      />
    </div>
  );
};

export default Department;
