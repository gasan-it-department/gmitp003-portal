import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//
import {
  Item,
  ItemContent,
  ItemTitle,
  ItemHeader,
  //ItemFooter,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Mail, Building } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormMessage,
  FormLabel,
  FormField,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
//
import { addModuleUserPrevilege, getInitials } from "@/utils/helper";
import { searchedChar } from "@/utils/element";
//
//
import { AddModuleUserSchema } from "@/interface/zod";
import type { User as UserProps, AddModuleUserProps } from "@/interface/data";
interface Props {
  item: UserProps;
  module: string;
  query: string;
  token: string;
  lineId: string;
  currUserId: string;
}

const EmployeeItem = ({
  item,
  query,
  module,
  token,
  lineId,
  currUserId,
}: Props) => {
  const [onOpen, setOnOpen] = useState(0);

  const form = useForm<AddModuleUserProps>({
    resolver: zodResolver(AddModuleUserSchema),
    defaultValues: {
      previlege: "",
    },
  });
  const {
    handleSubmit,
    formState: { isSubmitting },
    control,
  } = form;

  const onSubmit = async (data: AddModuleUserProps) => {
    try {
      const response = await axios.post(
        "/module/add/acces",
        {
          userId: item.id,
          privilege: parseInt(data.previlege, 10),
          lineId: lineId,
          module,
          currUserId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );

      if (response.status !== 200) {
        toast.error("Failed", {
          description: response.data.message,
        });
        return;
      }
      toast.success("Successfully granted module access.");
    } catch (error) {
      console.log(error);

      toast.error("FaIled to submit");
    } finally {
      setOnOpen(0);
    }
  };

  return (
    <>
      <Item key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
        <ItemHeader className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Avatar>
                {item.userProfilePictures && (
                  <AvatarImage src={item.userProfilePictures.file_url} />
                )}
                <AvatarFallback>
                  {getInitials(item.firstName)}
                  {getInitials(item.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <ItemTitle className="text-base">
                {searchedChar(query, item.firstName)}
                {searchedChar(query, item.lastName)}
                {item.middleName && ` ${searchedChar(query, item.middleName)}`}
                {item.suffix && `, ${item.suffix}`}
              </ItemTitle>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Mail className="w-3 h-3" />
                  <span>{searchedChar(query, item.email)}</span>
                </div>
                {item.department && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Building className="w-3 h-3" />
                    <span>{item.department.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setOnOpen(1)}>
            Add
          </Button>
        </ItemHeader>

        <ItemContent>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>@{searchedChar(query, item.username)}</span>
            {/* <Badge
                    >
                      {user.status}
                    </Badge> */}
          </div>
        </ItemContent>
      </Item>
      <Modal
        title="Add Module Access"
        onOpen={onOpen === 1}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
        }}
        className="max-w-md"
        footer={true}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      >
        <div className="space-y-6">
          {/* User Info Section */}
          <div className="flex flex-col items-center text-center space-y-4">
            <Avatar className="h-20 w-20">
              {item.userProfilePictures && (
                <AvatarImage src={item.userProfilePictures.file_url} />
              )}
              <AvatarFallback className="text-lg">
                {getInitials(item.firstName)}
                {getInitials(item.lastName)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-lg font-semibold">
                {item.firstName} {item.lastName}
              </h2>
              <p className="text-sm text-gray-600">
                Allow access to module:{" "}
                <span className="font-medium">{module}</span>
              </p>
            </div>
          </div>

          {/* Divider */}
          {/* Permission Form */}
          <div className="space-y-4">
            <Form {...form}>
              <FormField
                control={control}
                name="previlege"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Privilege Level</FormLabel>
                    <FormDescription className="text-sm">
                      Select the permission level for this user
                    </FormDescription>
                    <FormControl>
                      <Select onValueChange={field.onChange}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select permission level" />
                        </SelectTrigger>
                        <SelectContent>
                          {addModuleUserPrevilege.map((item, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                {item}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(EmployeeItem);
