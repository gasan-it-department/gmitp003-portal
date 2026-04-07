import { memo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/db/axios";
//
import {
  Item,
  ItemTitle,
  ItemHeader,
  //ItemFooter,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import { Mail, Building, Shield, UserPlus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
    reset,
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
      reset();
    } catch (error) {
      console.log(error);
      toast.error("Failed to submit");
    } finally {
      setOnOpen(0);
    }
  };

  return (
    <>
      <Item className="p-3 hover:bg-gray-50 transition-all duration-200 cursor-pointer border rounded-md bg-white">
        <ItemHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10 ring-2 ring-gray-100">
              {item.userProfilePictures && (
                <AvatarImage src={item.userProfilePictures.file_url} />
              )}
              <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                {getInitials(item.firstName)}
                {getInitials(item.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <ItemTitle className="text-sm font-semibold text-gray-900 truncate">
                {searchedChar(query, item.firstName)}{" "}
                {searchedChar(query, item.lastName)}
                {item.middleName && ` ${searchedChar(query, item.middleName)}`}
                {item.suffix && `, ${item.suffix}`}
              </ItemTitle>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">
                    {searchedChar(query, item.email)}
                  </span>
                </div>
                {item.department && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Building className="h-3 w-3" />
                    <span className="truncate">{item.department.name}</span>
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  @{searchedChar(query, item.username)}
                </div>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setOnOpen(1)}
            className="gap-1.5 text-xs h-8 px-3 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add
          </Button>
        </ItemHeader>
      </Item>

      <Modal
        title="Grant Module Access"
        onOpen={onOpen === 1}
        setOnOpen={() => {
          if (isSubmitting) return;
          setOnOpen(0);
          reset();
        }}
        className="max-w-md"
        footer={true}
        onFunction={handleSubmit(onSubmit)}
        loading={isSubmitting}
      >
        <div className="space-y-5 p-1">
          {/* User Info Section */}
          <div className="flex flex-col items-center text-center space-y-3 pb-3 border-b">
            <Avatar className="h-16 w-16 ring-4 ring-blue-50">
              {item.userProfilePictures && (
                <AvatarImage src={item.userProfilePictures.file_url} />
              )}
              <AvatarFallback className="text-base font-medium bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                {getInitials(item.firstName)}
                {getInitials(item.lastName)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {item.firstName} {item.lastName}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">{item.email}</p>
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                >
                  Module: {module}
                </Badge>
              </div>
            </div>
          </div>

          {/* Permission Form */}
          <Form {...form}>
            <FormField
              control={control}
              name="previlege"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Privilege Level
                  </FormLabel>
                  <FormDescription className="text-xs text-gray-500">
                    Select the permission level for this user
                  </FormDescription>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="mt-1 h-9 text-sm">
                        <SelectValue placeholder="Select permission level" />
                      </SelectTrigger>
                      <SelectContent>
                        {addModuleUserPrevilege.map((item, i) => (
                          <SelectItem
                            key={i}
                            value={i.toString()}
                            className="text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  i === 0
                                    ? "bg-green-500"
                                    : i === 1
                                      ? "bg-blue-500"
                                      : i === 2
                                        ? "bg-amber-500"
                                        : "bg-gray-500"
                                }`}
                              />
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

          {/* Info Alert */}
          <div className="rounded-md bg-blue-50 p-3 border border-blue-100">
            <div className="flex gap-2">
              <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-blue-900 mb-0.5">
                  About Privilege Levels
                </p>
                <p className="text-xs text-blue-700">
                  Higher privilege levels grant more access to module features.
                  Choose appropriately based on user's role.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default memo(EmployeeItem);
