import { useState } from "react";

//hooks and libs
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  //FormMessage,
  FormLabel,
} from "@/components/ui/form";
import Modal from "@/components/custom/Modal";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
//
import { NewEmployeeSchema } from "@/interface/zod";
import type { NewEmployeeProps } from "@/interface/data";

//

//icons
import { Link } from "lucide-react";

//
//import { useAuth } from "@/provider/ProtectedRoute";

const AddEmployee = () => {
  const form = useForm<NewEmployeeProps>({
    resolver: zodResolver(NewEmployeeSchema),
  });
  const {
    //handleSubmit,
    //formState: { isSubmitting, errors },
    //setError,
    control,
  } = form;

  const [onOpen, setOnOpen] = useState(0);

  //const auth = useAuth();

  return (
    <div className=" w-full h-full  overflow-auto">
      {/* <Regions selectComp={false} token={auth.token as string} source={1} />
      <Provinces selectComp={false} code="170000000" />
      <Municipalities selectComp={false} code="174000000" />
      <Po
      <Barangay selectComp={false} code="174003000" /> */}
      <TooltipProvider>
        <div className=" w-full h-auto flex justify-end py-2 bg-white">
          <Tooltip delayDuration={1000}>
            <TooltipTrigger id="invite-link-id">
              <Button
                onClick={() => setOnOpen(1)}
                variant="outline"
                size="sm"
                className=" mr-2 cursor-pointer"
              >
                <Link />
              </Button>
            </TooltipTrigger>
            <TooltipContent id="invite-link-id-content">Invite</TooltipContent>
          </Tooltip>
        </div>
        <div>
          <Form {...form}>
            <div>
              <FormDescription>Employee Information</FormDescription>
              <FormField
                control={control}
                name="lastName"
                render={({ field: { value, onBlur, onChange } }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        onBlur={onBlur}
                        value={value}
                        onChange={onChange}
                        placeholder="Type last name here"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="firstName"
                render={({ field: { value, onBlur, onChange } }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        onBlur={onBlur}
                        value={value}
                        onChange={onChange}
                        placeholder="Type first name here"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="middleName"
                render={({ field: { value, onBlur, onChange } }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input
                        onBlur={onBlur}
                        value={value}
                        onChange={onChange}
                        placeholder="Type middle name here"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="birthDate"
                render={({ field: { onBlur, onChange } }) => (
                  <FormItem>
                    <FormLabel>Date of Birth (DD/MM/YYYY)</FormLabel>
                    <FormControl>
                      <Input
                        onBlur={onBlur}
                        onChange={onChange}
                        placeholder="Type fullname here"
                        type="date"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="firstName"
                render={({ field: { value, onBlur, onChange } }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        onBlur={onBlur}
                        value={value}
                        onChange={onChange}
                        placeholder="Type fullname here"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </Form>
        </div>
      </TooltipProvider>
      <Modal
        title={"Create Invite Link"}
        children={undefined}
        onOpen={onOpen === 1}
        className={""}
        setOnOpen={() => setOnOpen(0)}
        yesTitle="Go"
        footer={true}
      />
    </div>
  );
};

export default AddEmployee;
