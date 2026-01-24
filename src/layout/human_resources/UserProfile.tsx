import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { getUserData } from "@/db/statements/user";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Mail,
  Building,
  User as UserIcon,
  Award,
  FileText,
  CreditCard,
  Fingerprint,
  Heart,
  Home,
  Smartphone,
  EllipsisVertical,
  CirclePause,
  Trash,
} from "lucide-react";
import type { User } from "@/interface/data";
import UserProfileAction from "./UserProfileAction";

//
import { userActiveStatus } from "@/utils/helper";

const UserProfile = () => {
  const { employeeId, lineId } = useParams();
  const auth = useAuth();

  const {
    data: user,
    isError,
    isFetching,
  } = useQuery<User>({
    queryKey: ["user-data", employeeId],
    queryFn: () =>
      getUserData(
        auth.token as string,
        employeeId as string,
        auth.userId as string
      ),
  });

  console.log({ user });

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Failed to load user data</p>
      </div>
    );
  }

  const getInitials = () => {
    return `${user.firstName?.[0] || ""}${
      user.lastName?.[0] || ""
    }`.toUpperCase();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  console.log({ user });

  return (
    <div className="w-full h-full p-6 overflow-auto bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-md">
              {user.userProfilePictures ? (
                <AvatarImage
                  src={user.userProfilePictures.file_url}
                  alt={`${user.firstName} ${user.lastName}`}
                />
              ) : null}
              <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.submittedApplications?.firstname}{" "}
                {user.middleName
                  ? `${user.submittedApplications?.middleName}. `
                  : ""}{" "}
                {user.submittedApplications?.lastname} {user.suffix || ""}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {user.account && (
                  <Badge
                    variant={user.status === "active" ? "default" : "secondary"}
                    className="px-3 py-1"
                  >
                    {userActiveStatus[user.account.status]}
                  </Badge>
                )}

                <span className="text-sm text-gray-600">
                  Level {user.level}
                </span>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm text-gray-600">
                  Joined {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <UserProfileAction
            userId={auth.userId as string}
            accountId={user.accountId as string}
            lineId={lineId as string}
            token={auth.token as string}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="social">Social Welfare</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Personal Information Card */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Email Address
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">
                            {user.submittedApplications?.email || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Phone number
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Smartphone className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-900">
                            {user.submittedApplications?.mobileNo || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Username
                        </p>
                        <p className="text-gray-900">{user.username}</p>
                      </div>
                      {user.birthDate && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            Date of Birth
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p className="text-gray-900">
                              {formatDate(user.birthDate)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className=" font-medium text-neutral-800">
                        Residential
                      </p>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Province
                        </p>
                        <p className="text-gray-900">
                          {user.submittedApplications?.resProvince ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Municipality
                        </p>
                        <p className="text-gray-900">
                          {user.submittedApplications?.resCity ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Barangay
                        </p>
                        <p className="text-gray-900">
                          {user.submittedApplications?.resBarangay ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className=" font-medium text-neutral-800">Permanent</p>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Province
                        </p>
                        <p className="text-gray-900">
                          {user.submittedApplications?.permaProvince ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Municipality
                        </p>
                        <p className="text-gray-900">
                          {user.submittedApplications?.permaCity ||
                            "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Barangay
                        </p>
                        <p className="text-gray-900">
                          {user.submittedApplications?.permaBarangay ||
                            "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department & Position */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Department & Position
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Department
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.department?.name || "Not assigned"}
                      </p>
                      {user.headedDepartment && (
                        <Badge variant="secondary" className="mt-2">
                          Department Head
                        </Badge>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Position
                      </p>
                      {/* <p className="text-lg font-semibold text-gray-900">
                        {user.Position?.title || "Not assigned"}
                      </p> */}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Salary Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Compensation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Salary Grade
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-lg font-semibold text-gray-900">
                          {user.SalaryGrade?.grade || "Not specified"}
                        </p>
                        {/* {user.SalaryGrade?.step && (
                          <Badge variant="outline">Step {user.SalaryGrade.step}</Badge>
                        )} */}
                      </div>
                      {user.SalaryGrade?.amount && (
                        <p className="text-sm text-gray-600 mt-1">
                          ₱{user.SalaryGrade.amount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Government IDs & Social Welfare
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Official identification numbers and social welfare memberships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Government IDs Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                      Government Identification
                    </h3>

                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">
                          TIN (Tax Identification Number)
                        </span>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium">
                            {user?.submittedApplications?.tinNo ? (
                              user?.submittedApplications?.tinNo
                            ) : (
                              <span className="text-gray-400 italic">
                                Not provided
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">
                          UMID (Unified Multi-Purpose ID)
                        </span>
                        <div className="flex items-center">
                          <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium">
                            {user?.submittedApplications?.umidNo ? (
                              user?.submittedApplications.umidNo
                            ) : (
                              <span className="text-gray-400 italic">
                                Not provided
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">
                          PhilSys (Philippine Identification System)
                        </span>
                        <div className="flex items-center">
                          <Fingerprint className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-medium">
                            {user?.submittedApplications?.philSys ? (
                              user?.submittedApplications.philSys
                            ) : (
                              <span className="text-gray-400 italic">
                                Not registered
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Welfare Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
                      Social Welfare Memberships
                    </h3>

                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">
                          Pag-IBIG Fund
                        </span>
                        <div className="flex items-center">
                          <Home className="h-4 w-4 text-blue-400 mr-2" />
                          <span className="font-medium">
                            {user?.submittedApplications?.pagIbigNo ? (
                              user?.submittedApplications.pagIbigNo
                            ) : (
                              <span className="text-gray-400 italic">
                                Not a member
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">
                          PhilHealth
                        </span>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 text-red-400 mr-2" />
                          <span className="font-medium">
                            {user?.submittedApplications?.philHealthNo ? (
                              user?.submittedApplications.philHealthNo
                            ) : (
                              <span className="text-gray-400 italic">
                                Not a member
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1">
                          Agency Number
                        </span>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-green-400 mr-2" />
                          <span className="font-medium">
                            {user?.submittedApplications?.agencyNo ? (
                              user?.submittedApplications.agencyNo
                            ) : (
                              <span className="text-gray-400 italic">
                                Not assigned
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Summary */}
                {/* <div className="mt-8 pt-6 border-t">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Membership Status Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${tinNo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-xs">TIN {tinNo ? 'Registered' : 'Pending'}</span>
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${umidNo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-xs">UMID {umidNo ? 'Issued' : 'Not Issued'}</span>
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${pagIbigNo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-xs">Pag-IBIG {pagIbigNo ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${philHealthNo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-xs">PhilHealth {philHealthNo ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${philSys ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-xs">PhilSys {philSys ? 'Registered' : 'Not Registered'}</span>
          </div>
        </div>
      </div> */}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Modules</CardTitle>
                <CardDescription>
                  {user.modules?.length || 0} modules assigned to this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.modules && user.modules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.modules.map((module, index) => (
                      <Card
                        key={index}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          {/* <h4 className="font-medium text-gray-900">{module.name}</h4>
                          {module.description && (
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          )} */}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No modules assigned
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
