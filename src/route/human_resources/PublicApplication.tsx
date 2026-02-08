import { useQuery } from "@tanstack/react-query";
import { useTemAuth } from "@/provider/TempAuthProvider";
import { useParams } from "react-router";
//db/statements
import { publicApplicationData } from "@/db/statement";
//
import OTP from "@/layout/OTP";
//
import type { SubmittedApplicationProps } from "@/interface/data";
import {
  formatPureDate,
  formatDate,
  calculateExperienceDuration,
} from "@/utils/date";
import { calculateAge, applicantionStatus } from "@/utils/helper";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

//
//icons
import {
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  GraduationCap,
  Briefcase,
  Award,
  Heart,
  Users,
  Home,
  Shield,
  Lightbulb,
  BookMarked,
  Trophy,
} from "lucide-react";
import PublicApplicationContact from "@/layout/PublicApplicationContact";

const PublicApplication = () => {
  const { applicationId } = useParams();
  const { token } = useTemAuth();

  const { data, isFetching } = useQuery<SubmittedApplicationProps>({
    queryKey: ["public-application-data", applicationId],
    queryFn: () =>
      publicApplicationData(token as string, applicationId as string),
    enabled: !!applicationId && !!token,
  });

  // Show OTP verification if token is false/undefined
  if (!token) {
    return <OTP id={applicationId} to={0} />;
  }

  // Show loading state
  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-8 h-8 mx-auto mb-4" />
          <p className="text-gray-600">Loading application data...</p>
        </div>
      </div>
    );
  }

  // Show error state if no data
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="font-semibold text-gray-800 text-lg mb-2">
            Application Not Found
          </p>
          <p className="text-gray-600">
            The application data could not be loaded or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full h-full relative">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={data.profilePic?.file_url}
                alt={data.profilePic?.file_name}
              />
              <AvatarFallback>
                {data.firstname?.[0]}
                {data.lastname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {data.firstname} {data.middleName || ""} {data.lastname}{" "}
                {data.suffix || ""}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                {data.forPosition && (
                  <Badge variant="secondary" className="text-sm">
                    {data.forPosition.name}
                  </Badge>
                )}
                <Badge variant={data.status === 1 ? "default" : "outline"}>
                  {applicantionStatus[data.status + 1]}
                </Badge>
                <span className="text-sm text-gray-500">
                  Applied on {formatDate(data.timestamp)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Full Name
                    </label>
                    <p className="text-gray-900">
                      {data.firstname} {data.middleName || ""} {data.lastname}{" "}
                      {data.suffix || ""}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Birth Date & Age
                    </label>
                    <p className="text-gray-900">
                      {formatPureDate(data.birthDate)} (
                      {calculateAge(data.birthDate)} years old)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Gender
                    </label>
                    <p className="text-gray-900 capitalize">{data.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Civil Status
                    </label>
                    <p className="text-gray-900 capitalize">
                      {data.civilStatus}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Citizenship
                    </label>
                    <p className="text-gray-900">
                      {data.filipino ? "Filipino" : "Foreigner"}
                      {data.dualCitizen &&
                        `, Dual Citizen (${data.dualCitizenHalf})`}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Blood Type
                    </label>
                    <p className="text-gray-900">
                      {data.bloodType || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work Experience */}
            {data.experience && data.experience.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Work Experience
                    <Badge variant="outline" className="ml-2">
                      {data.experience.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.experience.map((exp, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {exp.position || "Position"}
                        </h4>
                        <Badge variant="secondary" className="mt-1 sm:mt-0">
                          {calculateExperienceDuration(exp.from, exp.to)}
                        </Badge>
                      </div>
                      <p className="text-gray-700 font-medium">
                        {exp.department || exp.employer}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPureDate(exp.from)} -{" "}
                        {exp.to ? formatPureDate(exp.to) : "Present"}
                      </p>

                      {exp.statusOfAppointment && (
                        <p className="text-sm text-gray-600">
                          Status: {exp.statusOfAppointment}
                        </p>
                      )}
                      {!exp.govService && (
                        <Badge variant="outline" className="mt-1">
                          Government Service
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Civil Service Eligibility */}
            {data.civilService && data.civilService.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Civil Service Eligibility
                    <Badge variant="outline" className="ml-2">
                      {data.civilService.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.civilService.map((eligibility, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-green-500 pl-4 py-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {eligibility.title}
                        </h4>
                        <Badge variant="secondary">
                          Rating: {eligibility.rating}
                        </Badge>
                      </div>
                      <p className="text-gray-700">{eligibility.type}</p>
                      <p className="text-sm text-gray-600">
                        Date: {formatPureDate(eligibility.date)}
                      </p>
                      {eligibility.placeOfExam && (
                        <p className="text-sm text-gray-600">
                          Place of Exam: {eligibility.placeOfExam}
                        </p>
                      )}
                      {eligibility.number && (
                        <p className="text-sm text-gray-600">
                          License Number: {eligibility.number}
                        </p>
                      )}
                      {eligibility.validity && (
                        <p className="text-sm text-gray-600">
                          Validity: {eligibility.validity}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Educational Background */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Educational Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Elementary */}
                {data.elementary && (
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Elementary
                    </h4>
                    <p className="text-gray-700">{data.elementary.name}</p>
                    <p className="text-sm text-gray-600">
                      {data.elementary.from} - {data.elementary.to}
                    </p>
                    {data.elementary.highestLevel && (
                      <p className="text-sm text-gray-600">
                        Highest Level: {data.elementary.highestLevel}
                      </p>
                    )}
                    {data.elementary.yearGraduated && (
                      <p className="text-sm text-gray-600">
                        Year Graduated: {data.elementary.yearGraduated}
                      </p>
                    )}
                    {data.elementary.honors && (
                      <p className="text-sm text-gray-600">
                        Honors: {data.elementary.honors}
                      </p>
                    )}
                  </div>
                )}

                {/* Secondary */}
                {data.secondary && (
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Secondary
                    </h4>
                    <p className="text-gray-700">{data.secondary.name}</p>
                    <p className="text-sm text-gray-600">
                      {data.secondary.from} - {data.secondary.to}
                    </p>
                    {data.secondary.highestLevel && (
                      <p className="text-sm text-gray-600">
                        Highest Level: {data.secondary.highestLevel}
                      </p>
                    )}
                    {data.secondary.yearGraduated && (
                      <p className="text-sm text-gray-600">
                        Year Graduated: {data.secondary.yearGraduated}
                      </p>
                    )}
                    {data.secondary.honors && (
                      <p className="text-sm text-gray-600">
                        Honors: {data.secondary.honors}
                      </p>
                    )}
                  </div>
                )}

                {/* Vocational */}
                {data.vocational && (
                  <div className="border-l-4 border-orange-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Vocational/Trade Course
                    </h4>
                    <p className="text-gray-700">{data.vocational.name}</p>
                    <p className="text-sm text-gray-600">
                      {data.vocational.from} - {data.vocational.to}
                    </p>
                    {data.vocational.highestLevel && (
                      <p className="text-sm text-gray-600">
                        Highest Level: {data.vocational.highestLevel}
                      </p>
                    )}
                    {data.vocational.yearGraduated && (
                      <p className="text-sm text-gray-600">
                        Year Graduated: {data.vocational.yearGraduated}
                      </p>
                    )}
                    {data.vocational.honors && (
                      <p className="text-sm text-gray-600">
                        Honors: {data.vocational.honors}
                      </p>
                    )}
                  </div>
                )}

                {/* College */}
                {data.college && (
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      College
                    </h4>
                    <p className="text-gray-700">{data.college.name}</p>
                    <p className="text-sm text-gray-600">
                      {data.college.from} - {data.college.to}
                    </p>
                    {data.college.degree && (
                      <p className="text-sm text-gray-600">
                        Degree: {data.college.degree}
                      </p>
                    )}
                    {data.college.highestLevel && (
                      <p className="text-sm text-gray-600">
                        Highest Level: {data.college.highestLevel}
                      </p>
                    )}
                    {data.college.yearGraduated && (
                      <p className="text-sm text-gray-600">
                        Year Graduated: {data.college.yearGraduated}
                      </p>
                    )}
                    {data.college.honors && (
                      <p className="text-sm text-gray-600">
                        Honors: {data.college.honors}
                      </p>
                    )}
                    {data.college.unitsEarned && (
                      <p className="text-sm text-gray-600">
                        Units Earned: {data.college.unitsEarned}
                      </p>
                    )}
                  </div>
                )}

                {/* Graduate Studies */}
                {data.graduateCollege && (
                  <div className="border-l-4 border-red-500 pl-4 py-2">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Graduate Studies
                    </h4>
                    <p className="text-gray-700">{data.graduateCollege.name}</p>
                    <p className="text-sm text-gray-600">
                      {data.graduateCollege.from} - {data.graduateCollege.to}
                    </p>
                    {data.graduateCollege.degree && (
                      <p className="text-sm text-gray-600">
                        Degree: {data.graduateCollege.degree}
                      </p>
                    )}
                    {data.graduateCollege.highestLevel && (
                      <p className="text-sm text-gray-600">
                        Highest Level: {data.graduateCollege.highestLevel}
                      </p>
                    )}
                    {data.graduateCollege.yearGraduated && (
                      <p className="text-sm text-gray-600">
                        Year Graduated: {data.graduateCollege.yearGraduated}
                      </p>
                    )}
                    {data.graduateCollege.honors && (
                      <p className="text-sm text-gray-600">
                        Honors: {data.graduateCollege.honors}
                      </p>
                    )}
                    {data.graduateCollege.unitsEarned && (
                      <p className="text-sm text-gray-600">
                        Units Earned: {data.graduateCollege.unitsEarned}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Voluntary Work */}
            {data.voluntaryWork && data.voluntaryWork.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Voluntary Work
                    <Badge variant="outline" className="ml-2">
                      {data.voluntaryWork.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.voluntaryWork.map((work, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-pink-500 pl-4 py-2"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {work.organization}
                      </h4>
                      <p className="text-gray-700">{work.position}</p>
                      <p className="text-sm text-gray-600">
                        {formatPureDate(work.from)} -{" "}
                        {work.to ? formatPureDate(work.to) : "Present"}
                      </p>
                      {work.hours && (
                        <p className="text-sm text-gray-600">
                          {work.hours} hours
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Learning and Development */}
            {data.learningDev && data.learningDev.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Learning & Development
                    <Badge variant="outline" className="ml-2">
                      {data.learningDev.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.learningDev.map((training, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-yellow-500 pl-4 py-2"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {training.title}
                      </h4>
                      <p className="text-gray-700">{training.conductedBy}</p>
                      <p className="text-sm text-gray-600">
                        {formatPureDate(training.from)} -{" "}
                        {training.to ? formatPureDate(training.to) : "Present"}
                      </p>
                      {training.hours && (
                        <p className="text-sm text-gray-600">
                          {training.hours} hours
                        </p>
                      )}
                      {training.type && (
                        <Badge variant="outline" className="mt-1">
                          {training.type}
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Other Information */}
            {data.otherInfo && data.otherInfo.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5" />
                    Other Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.otherInfo.map((info, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-gray-500 pl-4 py-2"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {info.specialSkills}
                      </h4>
                      <p className="text-gray-700">{info.recognition}</p>
                      {info.membership && (
                        <p className="text-sm text-gray-600">
                          Membership: {info.membership}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* References */}
            {data.references && data.references.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    References
                    <Badge variant="outline" className="ml-2">
                      {data.references.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.references.map((ref, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-indigo-500 pl-4 py-2"
                    >
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {ref.name} - {ref.position}
                      </h4>
                      <p className="text-gray-700">{ref.company}</p>
                      <p className="text-sm text-gray-600">{ref.address}</p>
                      <p className="text-sm text-gray-600">
                        Tel: {ref.telephone}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Additional Information */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </label>
                    <p className="text-gray-900">{data.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Mobile Number
                    </label>
                    <p className="text-gray-900">{data.mobileNo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Telephone Number
                    </label>
                    <p className="text-gray-900">
                      {data.teleNo || "Not provided"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4" />
                    Residential Address
                  </label>
                  <p className="text-gray-900 text-sm">
                    {[
                      data.reshouseBlock,
                      data.resStreet,
                      data.resSub,
                      data.resBarangay,
                      data.resCity,
                      data.resProvince,
                      data.resZipCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Permanent Address
                  </label>
                  <p className="text-gray-900 text-sm">
                    {[
                      data.permahouseBlock,
                      data.permaStreet,
                      data.permaSub,
                      data.permaBarangay,
                      data.permaCity,
                      data.permaProvince,
                      data.permaZipCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Physical Attributes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Physical Attributes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Height</span>
                  <span className="font-medium">{data.height} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Weight</span>
                  <span className="font-medium">{data.weight} kg</span>
                </div>
              </CardContent>
            </Card>

            {/* Government IDs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Government IDs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.tinNo && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">TIN</span>
                    <span className="font-medium text-sm">{data.tinNo}</span>
                  </div>
                )}
                {data.pagIbigNo && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Pag-IBIG</span>
                    <span className="font-medium text-sm">
                      {data.pagIbigNo}
                    </span>
                  </div>
                )}
                {data.philHealthNo && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">PhilHealth</span>
                    <span className="font-medium text-sm">
                      {data.philHealthNo}
                    </span>
                  </div>
                )}
                {data.umidNo && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">UMID</span>
                    <span className="font-medium text-sm">{data.umidNo}</span>
                  </div>
                )}
                {data.philSys && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">PhilSys</span>
                    <span className="font-medium text-sm">{data.philSys}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Family Background */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Family Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.spouseFirstname && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Spouse
                    </label>
                    <p className="text-gray-900 text-sm">
                      {data.spouseFirstname} {data.spouseMiddle || ""}{" "}
                      {data.spouseSurname || ""}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Father
                  </label>
                  <p className="text-gray-900 text-sm">
                    {data.fatherFirstname} {data.fatherMiddlename || ""}{" "}
                    {data.fatherSurname || ""}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Mother
                  </label>
                  <p className="text-gray-900 text-sm">
                    {data.motherFirstname} {data.motherMiddlename || ""}{" "}
                    {data.motherSurname || ""}
                  </p>
                </div>
                {data.children && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Children
                    </label>
                    <p className="text-gray-900 text-sm">
                      {(JSON.parse(data.children) as { fullname: string }[])
                        .length > 0
                        ? (JSON.parse(data.children) as { fullname: string }[])
                            .map((item) => item.fullname)
                            .join(", ")
                        : "No children listed"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            {data.ApplicationSkillTags &&
              data.ApplicationSkillTags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {data.ApplicationSkillTags.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill.tags}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>
      </div>
      <ScrollBar orientation="vertical" />
      <PublicApplicationContact
        applicationId={applicationId as string}
        token={token as string}
      />
    </ScrollArea>
  );
};

export default PublicApplication;
