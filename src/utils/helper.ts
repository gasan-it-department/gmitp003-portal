import type { MedicineStock, PositionSlotProps } from "@/interface/data";

export const userActiveStatus = ["Offline", "Active", "Suspended"];
export const supplyOrderStatus = ["Drafted", "Pending", "Concluded"];
export const lineStatus = ["Inactinve", "Active", "Suspended"];
export const applicantionStatus = ["Pending", "For Interview", "Concluded"];
export const prescriptionStatus = ["Pending", "Viewed", "Concluded"];
export const applicationStatus = ["Pending", "Viewed", "Concluded"];
export const unitOfMeasures = [
  "bottle",
  "gallon",
  "piece",
  "pack",
  "box",
  "pair",
  "case",
  "yard",
  "meter",
  "centemeter",
  "liter",
  "kilogram",
  "ton",
  "dozen",
  "ream",
  "roll",
  "can",
  "unit",
  "bundle",
  "cart",
  "jar",
  "set",
  "pad",
  "tube",
];
export const prescriptionProgressStatus = [
  {
    tag: 1,
    progress: "Pending",
    desc: "Precription received, awaiting authorized user to review",
  },
  {
    tag: 2,
    progress: "Viewed/Reviewed",
    desc: "Pharmacist has seen and is processing the order",
  },
  {
    tag: 3,
    progress: "Returned",
    desc: "Sent back to the prescriber for clarification or changes",
  },
  {
    tag: 4,
    progress: "Dispensed",
    desc: "Medication prepared and given to the patient",
  },
  {
    tag: 5,
    progress: "Cancelled",
    desc: "Prescription was voided and will not be filled",
  },
];

export const getStatusBadge = (status: number) => {
  const statusMap = {
    0: {
      label: "Deactivated",
      variant: "destructive" as const,
      color: "bg-red-100 text-red-800",
    },
    1: {
      label: "Active",
      variant: "default" as const,
      color: "bg-green-100 text-green-800",
    },
    2: {
      label: "Maintenance",
      variant: "secondary" as const,
      color: "bg-yellow-100 text-yellow-800",
    },
    3: {
      label: "Suspended",
      variant: "secondary" as const,
      color: "bg-orange-100 text-yellow-800",
    },
  };
  return statusMap[status as keyof typeof statusMap] || statusMap[0];
};
export const supplyOrderStatusTextColor = [
  "orange-500",
  "#FAB12F",
  "green",
  "red",
];

export const medicineLogsMessage = ["Dispense", "Added", "Update", "Deleted"];

export const invitationErrorMessage = [
  "Application link Not found",
  "Application link has expired",
  "Application link maybe suspended or removed by the HR management",
];

export const orderResolve = ["To returned", "OK", "Considered"];

export const iconMainColor = "#222831";
export const fontMainColor = "#181C14";

export function generateSecureRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const length = 32;

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export const handleSupplyTrend = (recentPrice: number, lastPrice: number) => {
  if (lastPrice === 0) return "-- / --";
  if (recentPrice === lastPrice) return "-- / --";
  if (recentPrice === 0) return "-- / --";
  let subtrahend = recentPrice < lastPrice ? recentPrice : lastPrice;
  let menuend = recentPrice > lastPrice ? recentPrice : lastPrice;

  const curr = menuend - subtrahend;

  let trend: number = (curr / menuend) * 100;
  let sign: string;

  if (recentPrice > lastPrice) {
    sign = "+";
  } else {
    sign = "-";
  }
  return `${sign} ${Number(trend.toFixed(2))}%`;
};

export const handleSupplyTrendReport = (
  recentPrice: number,
  lastPrice: number,
) => {
  if (lastPrice === 0) return "NO report to show";
  if (recentPrice === lastPrice) return "NO report to show";
  if (recentPrice === 0) return "NO report to show";
  let subtrahend = recentPrice < lastPrice ? recentPrice : lastPrice;
  let menuend = recentPrice > lastPrice ? recentPrice : lastPrice;

  const curr = menuend - subtrahend;

  let trend: number = (curr / menuend) * 100;
  let sign: string;

  if (recentPrice > lastPrice) {
    sign = `Report: ${Number(trend.toFixed(2))}% higher than the last price`;
  } else {
    sign = `Report: ${Number(trend.toFixed(2))}% lower than the last price`;
  }
  return sign;
};

export const inviteLinkStatus = (index: number) => {
  const status = ["as", "Active", "Suspended", "Expired"];
  return status[index];
};

export const adminSupport = [
  { tag: "officeAssistant", cont: "Office Assistant" },
  { tag: "executiveAssistant", cont: "Executive Assistant" },
  { tag: "administrativeAssistant", cont: "Administrative Assistant" },
  { tag: "receptionist", cont: "Receptionist" },
  { tag: "officeManager", cont: "Office Manager" },
  { tag: "virtualAssistant", cont: "Virtual Assistant" },
];

export const itRoles = [
  { tag: "softwareDev", cont: "Software Development/Programming" },
  { tag: "webDeveloper", cont: "Web Developer" },
  { tag: "mobileDev", cont: "Mobile App Developer" },
  { tag: "frontendDev", cont: "Frontend Developer" },
  { tag: "backendDev", cont: "Backend Developer" },
  { tag: "fullstackDev", cont: "Full Stack Developer" },
  { tag: "devOps", cont: "DevOps Engineer" },
  { tag: "qaEngineer", cont: "QA Engineer" },
  { tag: "dataScientist", cont: "Data Scientist" },
  { tag: "dataAnalyst", cont: "Data Analyst" },
  { tag: "dataEncoding", cont: "Data Encoding" },
  { tag: "databaseAdmin", cont: "Database Administrator" },
  { tag: "itSupport", cont: "IT Support" },
  { tag: "networkAdmin", cont: "Network Administrator" },
  { tag: "cybersecurity", cont: "Cybersecurity Specialist" },
];

export const financeAccountng = [
  { tag: "accountancy", cont: "Accountancy" },
  { tag: "bookkeeper", cont: "Bookkeeper" },
  { tag: "financialAnalyst", cont: "Financial Analyst" },
  { tag: "accountant", cont: "Accountant" },
  { tag: "auditor", cont: "Auditor" },
  { tag: "payrollSpecialist", cont: "Payroll Specialist" },
];

export const humanResources = [
  { tag: "hrGeneralist", cont: "HR Generalist" },
  { tag: "recruiter", cont: "Recruiter" },
  { tag: "hrManager", cont: "HR Manager" },
  { tag: "trainingDevelopment", cont: "Training & Development" },
  { tag: "compensationBenefits", cont: "Compensation & Benefits" },
];

export const creativeDesign = [
  { tag: "graphicDesigner", cont: "Graphic Designer" },
  { tag: "uiUxDesigner", cont: "UI/UX Designer" },
  { tag: "videoEditor", cont: "Video Editor" },
  { tag: "motionGraphics", cont: "Motion Graphics Designer" },
  { tag: "contentCreator", cont: "Content Creator" },
  { tag: "digitalArtist", cont: "Digital Artist" },
];

export const marketSales = [
  { tag: "digitalMarketing", cont: "Digital Marketing" },
  { tag: "socialMediaManager", cont: "Social Media Manager" },
  { tag: "seoSpecialist", cont: "SEO Specialist" },
  { tag: "contentWriter", cont: "Content Writer" },
  { tag: "salesRepresentative", cont: "Sales Representative" },
  { tag: "accountManager", cont: "Account Manager" },
  { tag: "businessDevelopment", cont: "Business Development" },
];

export const management = [
  { tag: "projectManager", cont: "Project Manager" },
  { tag: "teamLead", cont: "Team Lead" },
  { tag: "departmentManager", cont: "Department Manager" },
  { tag: "operationsManager", cont: "Operations Manager" },
];

export const customerService = [
  { tag: "customerService", cont: "Customer Service Representative" },
  { tag: "customerSupport", cont: "Customer Support" },
  { tag: "callCenter", cont: "Call Center Agent" },
  { tag: "technicalSupport", cont: "Technical Support" },
];

export const educationTraining = [
  { tag: "education", cont: "Education/Teacher" },
  { tag: "trainer", cont: "Corporate Trainer" },
  { tag: "instructor", cont: "Instructor" },
  { tag: "academicCoordinator", cont: "Academic Coordinator" },
];

export const legalCom = [
  { tag: "legalAssistant", cont: "Legal Assistant" },
  { tag: "paralegal", cont: "Paralegal" },
  { tag: "complianceOfficer", cont: "Compliance Officer" },
];

export const healthCare = [
  { tag: "medicalCoder", cont: "Medical Coder" },
  { tag: "medicalTranscription", cont: "Medical Transcriptionist" },
  { tag: "healthcareAdmin", cont: "Healthcare Administrator" },
];

export const specializedRole = [
  { tag: "researchAnalyst", cont: "Research Analyst" },
  { tag: "businessAnalyst", cont: "Business Analyst" },
  { tag: "projectCoordinator", cont: "Project Coordinator" },
  { tag: "logisticsCoordinator", cont: "Logistics Coordinator" },
];

export const officesTags = [
  // Technical & IT Roles
  // Administrative & Support Roles
  // Finance & Accounting
  // Management & Leadership
  // Customer Service
  // Education & Training
  // Legal & Compliance
  // Healthcare (Office-based)
  // Specialized Roles
];

export const fieldTags = [
  // Construction & Trades
  { tag: "carpenter", cont: "Carpenter" },
  { tag: "electrician", cont: "Electrician" },
  { tag: "plumber", cont: "Plumber" },
  { tag: "welder", cont: "Welder" },
  { tag: "mason", cont: "Mason" },
  { tag: "painter", cont: "Painter" },
  { tag: "roofer", cont: "Roofer" },
  { tag: "constructionWorker", cont: "Construction Worker" },
  { tag: "heavyEquipmentOperator", cont: "Heavy Equipment Operator" },
  { tag: "constructionForeman", cont: "Construction Foreman" },

  // Manufacturing & Production
  { tag: "factoryWorker", cont: "Factory Worker" },
  { tag: "assemblyLine", cont: "Assembly Line Worker" },
  { tag: "machineOperator", cont: "Machine Operator" },
  { tag: "qualityInspector", cont: "Quality Inspector" },
  { tag: "productionSupervisor", cont: "Production Supervisor" },
  { tag: "warehouseWorker", cont: "Warehouse Worker" },
  { tag: "forkliftOperator", cont: "Forklift Operator" },
  { tag: "packagingOperator", cont: "Packaging Operator" },

  // Transportation & Logistics
  { tag: "deliveryDriver", cont: "Delivery Driver" },
  { tag: "truckDriver", cont: "Truck Driver" },
  { tag: "logisticsCoordinator", cont: "Logistics Coordinator" },
  { tag: "dispatcher", cont: "Dispatcher" },
  { tag: "courier", cont: "Courier" },
  { tag: "shippingClerk", cont: "Shipping Clerk" },
  { tag: "inventoryController", cont: "Inventory Controller" },

  // Maintenance & Repair
  { tag: "maintenanceTechnician", cont: "Maintenance Technician" },
  { tag: "autoMechanic", cont: "Auto Mechanic" },
  { tag: "applianceRepair", cont: "Appliance Repair Technician" },
  { tag: "facilitiesMaintenance", cont: "Facilities Maintenance" },
  { tag: "janitorialStaff", cont: "Janitorial Staff" },
  { tag: "groundskeeper", cont: "Groundskeeper" },

  // Healthcare Field Staff
  { tag: "fieldNurse", cont: "Field Nurse" },
  { tag: "homeHealthAide", cont: "Home Health Aide" },
  { tag: "caregiver", cont: "Caregiver" },
  { tag: "paramedic", cont: "Paramedic" },
  { tag: "medicalTechnician", cont: "Medical Technician" },

  // Security & Safety
  { tag: "securityGuard", cont: "Security Guard" },
  { tag: "patrolOfficer", cont: "Patrol Officer" },
  { tag: "safetyOfficer", cont: "Safety Officer" },
  { tag: "fireWatch", cont: "Fire Watch" },

  // Agriculture & Farming
  { tag: "farmWorker", cont: "Farm Worker" },
  { tag: "butcher", cont: "Butcher" },
  { tag: "harvester", cont: "Harvester" },
  { tag: "tractorOperator", cont: "Tractor Operator" },
  { tag: "irrigationSpecialist", cont: "Irrigation Specialist" },

  // Hospitality & Service Industry
  { tag: "kitchenStaff", cont: "Kitchen Staff" },
  { tag: "housekeeping", cont: "Housekeeping" },

  // Retail & Merchandising
  { tag: "storeClerk", cont: "Store Clerk" },
  { tag: "cashier", cont: "Cashier" },
  { tag: "stockClerk", cont: "Stock Clerk" },
  { tag: "merchandiser", cont: "Merchandiser" },
  { tag: "salesAssociate", cont: "Sales Associate" },

  // Technical Field Services
  { tag: "fieldServiceTechnician", cont: "Field Service Technician" },
  { tag: "installationTechnician", cont: "Installation Technician" },
  { tag: "cableTechnician", cont: "Cable Technician" },
  { tag: "satelliteTechnician", cont: "Satellite Technician" },
  { tag: "windTurbineTechnician", cont: "Wind Turbine Technician" },
  { tag: "solarPanelInstaller", cont: "Solar Panel Installer" },

  // Environmental & Sanitation
  { tag: "wasteCollector", cont: "Waste Collector" },
  { tag: "recyclingOperator", cont: "Recycling Operator" },
  { tag: "landscaper", cont: "Landscaper" },
  { tag: "gardener", cont: "Gardener" },
  { tag: "poolMaintenance", cont: "Pool Maintenance Technician" },

  // Event & Entertainment
  { tag: "eventStaff", cont: "Event Staff" },
  { tag: "stagehand", cont: "Stagehand" },
  { tag: "crewMember", cont: "Crew Member" },
  { tag: "usher", cont: "Usher" },

  // Surveying & Inspection
  { tag: "surveyor", cont: "Surveyor" },
  { tag: "buildingInspector", cont: "Building Inspector" },
  { tag: "qualityAuditor", cont: "Quality Auditor" },
  { tag: "fieldResearcher", cont: "Field Researcher" },
];

export const unitOfMeasure = [
  { value: "pieces", label: "Pieces" },
  { value: "sachet", label: "Sachet" },
  { value: "box", label: "Box" },
  { value: "ampule", label: "Ampule" },
  { value: "vial", label: "Vial" },
  { value: "tablet", label: "Tablet" },
  { value: "bottle", label: "Bottle" },
  { value: "capsule", label: "Capsule" },
  { value: "bot", label: "Bot" },
  { value: "tube", label: "Tube" },
  { value: "cap", label: "Cap" },
  { value: "nebule", label: "Nebule" },
];

export const getSlotSalaryGradeRange = (slots: PositionSlotProps[]) => {
  if (slots.length === 0) return "N/A";
  const count = slots.length;

  if (count === 1) return `${slots[count - 1].salaryGrade.grade}`;
  return `${slots[0].salaryGrade.grade}-${slots[count - 1].salaryGrade.grade}`;
};

export const downloadFromLink = (url: string, filename?: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || url.split("/").pop() || "download";
  link.target = "_blank"; // Open in new tab if download fails
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const fileSizeConverter = (value: number): string => {
  if (value === 0) return "0 Bytes";

  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(value) / Math.log(1024));

  if (i === 0) return `${value} Bytes`;

  return `${(value / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

export const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const addModuleUserPrevilege = ["Read and Write", "Read Only"];

export const allMedicineStock = (stocks: MedicineStock[]) => {
  console.log({ stocks });

  const total = stocks.reduce((base, acc) => {
    return base + acc.actualStock;
  }, 0);
  console.log({ total });

  return total;
};

export const switchYearIndex = (yearRange: string): number[] => {
  const years: number[] = [];
  const trimmed = yearRange.trim();

  if (trimmed.includes("-")) {
    const parts = trimmed.split("-");
    const parsedYears = parts
      .map((part) => parseInt(part.trim(), 10))
      .filter((num) => !isNaN(num));

    if (parsedYears.length > 0) {
      years.push(...parsedYears);
    }
  } else {
    const yearNum = parseInt(trimmed, 10);
    if (!isNaN(yearNum)) {
      years.push(yearNum);
    }
  }

  return years; // Return as-is for single year or already correct order
};

export const roomRegistration = ["Drafted", "Pending", "Approved", "Cancelled"];
