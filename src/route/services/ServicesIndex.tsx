import { Link, Outlet, useLocation, useParams } from "react-router";
import {
  Sparkles,
  MessageSquareWarning,
  CalendarDays,
  Wallet,
  ArrowLeft,
} from "lucide-react";

// Services portal: open to every authenticated line user, no Module-table
// gating. The index renders a tile grid; child routes render under it.
const SERVICE_TILES = [
  {
    title: "File a Complaint",
    path: "complaints",
    Icon: MessageSquareWarning,
    desc: "Report concerns and track the response.",
  },
  {
    title: "Leave Application",
    path: "leaves",
    Icon: CalendarDays,
    desc: "Apply for and review your own leaves.",
  },
  {
    title: "My Payslips",
    path: "payslips",
    Icon: Wallet,
    desc: "View your released payslips.",
  },
] as const;

const ServicesIndex = () => {
  const { lineId } = useParams();
  const loc = useLocation();
  const atRoot = loc.pathname.replace(/\/$/, "").endsWith("/services");

  if (atRoot) {
    return (
      <div className="w-full h-full overflow-auto bg-gradient-to-br from-blue-50/40 to-indigo-50/30">
        <div className="max-w-5xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link
              to={`/${lineId}`}
              className="text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" /> Control panel
            </Link>
          </div>
          <div className="border rounded-lg bg-white overflow-hidden mb-4">
            <div className="px-3 py-2 border-b bg-gray-50 flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-blue-100 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-900">
                  Employee Services
                </div>
                <div className="text-[10px] text-gray-500">
                  Open to every line user — no HR enrolment required.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICE_TILES.map((t) => (
              <Link
                key={t.path}
                to={t.path}
                className="group border rounded-lg bg-white p-4 hover:shadow-md hover:border-blue-300 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-md bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition">
                    <t.Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
                    {t.title}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {t.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ServicesIndex;
