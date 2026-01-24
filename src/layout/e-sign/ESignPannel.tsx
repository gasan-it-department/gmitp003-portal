import {} from "react";
import { useNavigate } from "react-router";

import {
  File,
  Settings,
  Send,
  ShieldCheck,
  Lock,
  FileCheck,
  FileSignature,
  Clock,
  Users,
  BarChart3,
  Archive,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const panels = [
  {
    name: "Document Upload & Archive",
    Icon: Upload,
    description:
      "Upload documents for secure archival and long-term storage with WORM compliance",
    stats: "Archive ready",
    path: "upload-archive",
  },
  {
    name: "Document Dissemination",
    Icon: Send,
    description: "Distribute documents for electronic review and signing",
    stats: "1,245 docs",
    path: "dissemination",
  },
  {
    name: "Digital Signatures",
    Icon: FileSignature,
    description: "Apply legally-binding digital signatures to documents",
    stats: "98% completion",
  },
  {
    name: "Signature Management",
    Icon: Settings,
    description: "Configure and manage signature profiles and permissions",
    stats: "42 templates",
  },
  {
    name: "Document Verification",
    Icon: ShieldCheck,
    description: "Validate document authenticity and signature integrity",
    stats: "100% accuracy",
  },
  {
    name: "Security Controls",
    Icon: Lock,
    description: "Manage document access controls and encryption settings",
    stats: "256-bit encryption",
  },
  {
    name: "Audit & Compliance",
    Icon: FileCheck,
    description: "Complete audit trail and compliance reporting",
    stats: "ISO 27001 compliant",
  },
  {
    name: "Document Analytics",
    Icon: BarChart3,
    description: "Track document workflows and signing metrics",
    stats: "Real-time data",
  },
  {
    name: "Team Management",
    Icon: Users,
    description: "Manage user roles, permissions, and team workflows",
    stats: "24/7 access",
  },
];
const ESignPannel = () => {
  const nav = useNavigate();

  return (
    <div className="w-full min-h-screen bg-white p-4 sm:p-6 lg:p-8 overflow-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg shadow-sm flex-shrink-0">
              <Archive className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                Municipal Document Management System (DMS)
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm leading-relaxed">
                A secure, centralized platform for structured storage, automated
                workflow management, and compliant archival of all finalized
                municipal documents. Features configurable approval routing and
                WORM-compliant archival to ensure document integrity and legal
                retention compliance across all departments.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 mb-1 sm:mb-2 text-xs inline-flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              System Operational
            </Badge>
            <p className="text-xs text-gray-500">v1.0.0 • Updated today</p>
          </div>
        </div>

        <Separator className="my-4 sm:my-6" />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-6 sm:mb-8 lg:mb-10">
          <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  Active Documents
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1 sm:mt-2">
                  1,847
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg flex-shrink-0 ml-2">
                <File className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">↑ 12% from last month</p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  Pending Signatures
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1 sm:mt-2">
                  243
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-amber-50 rounded-lg flex-shrink-0 ml-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">↓ 8% from last week</p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  Completion Rate
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1 sm:mt-2">
                  96.2%
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-emerald-50 rounded-lg flex-shrink-0 ml-2">
                <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">↑ 2.1% from target</p>
          </div>
          <div className="bg-gray-50 p-3 sm:p-4 lg:p-5 rounded-lg border border-gray-200 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  Avg. Processing Time
                </p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900 mt-1 sm:mt-2">
                  2.4h
                </p>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg flex-shrink-0 ml-2">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">↓ 0.8h from average</p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6 lg:mb-8">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Platform Modules
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
              Access specialized tools for document management
            </p>
          </div>
          <Badge variant="outline" className="text-xs bg-white w-fit sm:w-auto">
            {panels.length} modules
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {panels.map((panel, i) => (
            <Card
              key={i}
              className="group border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer bg-white overflow-hidden h-full"
              onClick={() => {
                if (!panel.path) return;
                nav(panel.path);
              }}
            >
              <CardHeader className="pb-3 sm:pb-4 lg:pb-5">
                <div className="flex items-start justify-between mb-3 sm:mb-4 lg:mb-5">
                  <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-gray-100 transition-colors flex-shrink-0">
                    <panel.Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs bg-white/80 flex-shrink-0"
                  >
                    Available
                  </Badge>
                </div>
                <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3 line-clamp-2">
                  {panel.name}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {panel.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Separator className="mb-3 sm:mb-4" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 truncate mr-2">
                    {panel.stats}
                  </span>
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 group-hover:bg-gray-100 transition-colors flex-shrink-0">
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gray-400"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 sm:mt-8 lg:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-100 flex-shrink-0">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 sm:mb-2">
                Enterprise-Grade Security
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Compliant with ISO 27001, GDPR, eIDAS, and SOC 2 Type II. All
                documents are encrypted with AES-256 and signatures are legally
                binding under ESIGN Act.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 pt-4 sm:pt-0 border-t border-gray-200 lg:border-none w-full lg:w-auto">
            <div className="text-left flex-1 lg:flex-none">
              <p className="text-xs font-medium text-gray-900">Support</p>
              <p className="text-xs text-gray-500 truncate">
                support@esignplatform.com
              </p>
            </div>
            <div className="h-8 w-px bg-gray-200 hidden lg:block"></div>
            <div className="text-left flex-1 lg:flex-none">
              <p className="text-xs font-medium text-gray-900">System Status</p>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-xs text-gray-500">All systems normal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESignPannel;
