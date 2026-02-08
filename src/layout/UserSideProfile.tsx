import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/provider/ProtectedRoute";
import { removeCookie } from "@/utils/cookies";
//db
import { getUserData } from "@/db/statements/user";
//
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Assuming you have Card components

//props/schema/interface
import type { User } from "@/interface/data";
import { LogOut } from "lucide-react";

const UserSideProfile = () => {
  const auth = useAuth();

  const nav = useNavigate();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["userProfile", auth.userId],
    queryFn: () =>
      getUserData(
        auth.token as string,
        auth.userId as string,
        auth.userId as string,
      ),
    enabled: !!auth.token && !!auth.userId,
  });

  console.log({ data });

  const handleLogout = () => {
    localStorage.removeItem("user");
    removeCookie(`auth_token-${auth.userId}`);
    nav("/auth");
  };

  useEffect(() => {
    refetch();
  }, [auth.userId]);

  if (isFetching) {
    return (
      <Card className="w-full h-full shadow-lg border-border/40">
        <CardHeader className="pb-4">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="space-y-2 text-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const user = data as User;
  const fullName = `${user.firstName} ${
    user.middleName ? user.middleName + " " : ""
  }${user.lastName}${user.suffix ? " " + user.suffix : ""}`;
  const profilePic = user.userProfilePictures?.file_url;
  const initials = `${user?.firstName?.charAt(0)}${user?.lastName?.charAt(0)}`;

  return (
    <Card className="w-full h-full shadow-lg border-border/40 overflow-auto">
      <CardHeader className="pb-6 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage
                src={profilePic}
                alt={fullName}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 right-2">
              <Badge
                variant={user.status === "active" ? "default" : "secondary"}
                className="px-3 py-1 font-semibold"
              >
                {user.status}
              </Badge>
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              Level {user.level}
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              {user.Position?.name || "No Position"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Department & Location Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              Work Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Department
                </p>
                <p className="font-medium">
                  {user.department?.name || "Not Assigned"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Location
                </p>
                <p className="font-medium">
                  {user.region?.name || user.province?.name || "Not Specified"}
                </p>
              </div>
            </div>
          </div>

          {/* Contact & Info Section */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Username
                </p>
                <p className="font-medium">{user.username}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Member Since
                </p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              {user.lineId && (
                <div className="space-y-1 md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Line ID
                  </p>
                  <p className="font-medium">{user.lineId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Modules Section */}
          {user.modules && user.modules.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">
                Access Modules
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.modules.map((module) => (
                  <Badge
                    key={module.id}
                    variant="secondary"
                    className="px-3 py-1.5 font-normal"
                  >
                    {module.moduleName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-8 pt-6 border-t">
          <Button className="w-full" variant="outline" onClick={handleLogout}>
            <LogOut /> Logout
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserSideProfile;
