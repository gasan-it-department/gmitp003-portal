import {
  AddNewSupplySchema,
  ConcludeApplicationSchema,
  CreateListSchame,
  LoginSchema,
  RefineTimebaseSchema,
  UpdateOrderItenSchema,
} from "./zod";
import {
  EmployeeFilterSchema,
  NewEmployeeSchema,
  AddPositionSchema,
  AddUnitSchema,
  AddUserSchema,
  AdminLoginSchema,
  CreateInventoryBoxSchema,
  AddNewDataSchema,
  NewOrderSchema,
  AddItemOrderSchema,
  DispenseItemSchema,
  RefinePeopleListSchema,
  CreateInviteLinkSchema,
  ApplicantTagsSchema,
  EligibilitySchema,
  PurchaseReqSchema,
  NewStorageLocationSchema,
  AddNewMedicineSchema,
  MedicineActionSchema,
  AddStorageMedSchema,
  DispensarySchema,
  PrecribeMedSchema,
  ReleasePrescribeMedSchema,
  ReleasePrescribeMedItemSchema,
  PostJobApplicationSchema,
  AddExistingPosition,
  JobApplicationRequirements,
  ContactApplicationSchema,
  SendApplicationMessageSchema,
  RefineApplicationSchema,
  NewUserSchema,
  AddModuleUserSchema,
  NewLineFormSchema,
  TimebaseFilterSchema,
  AnnouncementFormSchema,
  NewAnnouncementSchema,
  TransferMedStorageSchema,
  UpdateMedicineStockSchema,
  PrintTimebaseReport,
  SignatoryFormSchema,
  UpdateSalaryGradeSchema,
  LineRegisterSchema,
  PositionInvitationSchema,
  FillPositionSchema,
} from "./zod";
import z from "zod";
export type LoginProps = z.infer<typeof LoginSchema>;
export type EmployeeFilterProps = z.infer<typeof EmployeeFilterSchema>;
export type NewEmployeeProps = z.infer<typeof NewEmployeeSchema>;
export type AddPositionProps = z.infer<typeof AddPositionSchema>;
export type AddUnitProps = z.infer<typeof AddUnitSchema>;
export type AddUserProps = z.infer<typeof AddUserSchema>;
export type AdminLoginProps = z.infer<typeof AdminLoginSchema>;
export type CreateNewInventory = z.infer<typeof CreateInventoryBoxSchema>;
export type CreateListProps = z.infer<typeof CreateListSchame>;
export type AddNewDataSetProps = z.infer<typeof AddNewDataSchema>;
export type AddNewSupplyProps = z.infer<typeof AddNewSupplySchema>;
export type NewOrderProps = z.infer<typeof NewOrderSchema>;
export type AddItemOrderProps = z.infer<typeof AddItemOrderSchema>;
export type UpdateOrderItenProps = z.infer<typeof UpdateOrderItenSchema>;
export type DispenseItemProps = z.infer<typeof DispenseItemSchema>;
export type RefineTimebaseProps = z.infer<typeof RefineTimebaseSchema>;
export type RefinePeopleListProps = z.infer<typeof RefinePeopleListSchema>;
export type CreateInviteLinkProps = z.infer<typeof CreateInviteLinkSchema>;
export type ApplicantTagsProps = z.infer<typeof ApplicantTagsSchema>;
export type EligibilityProps = z.infer<typeof EligibilitySchema>;
export type PurchaseReqProps = z.infer<typeof PurchaseReqSchema>;
export type NewStorageLocationProps = z.infer<typeof NewStorageLocationSchema>;
export type AddNewMedicineProps = z.infer<typeof AddNewMedicineSchema>;
export type MedicineActionProps = z.infer<typeof MedicineActionSchema>;
export type AddStorageMedProps = z.infer<typeof AddStorageMedSchema>;
export type DispensaryProps = z.infer<typeof DispensarySchema>;
export type PrescribeMedProps = z.infer<typeof PrecribeMedSchema>;
export type PostJobApplicationProps = z.infer<typeof PostJobApplicationSchema>;
export type ReleasePrescribeMedProps = z.infer<
  typeof ReleasePrescribeMedSchema
>;
export type AddExistingPositionProps = z.infer<typeof AddExistingPosition>;
export type ReleasePrescribeMedItemProps = z.infer<
  typeof ReleasePrescribeMedItemSchema
>;
export type JobApplicationRequirementsProps = z.infer<
  typeof JobApplicationRequirements
>;
export type ContactApplicationProps = z.infer<typeof ContactApplicationSchema>;
export type SendApplicationMessageSchemaProps = z.infer<
  typeof SendApplicationMessageSchema
>;
export type NewUserProps = z.infer<typeof NewUserSchema>;
export type RefineApplicationProps = z.infer<typeof RefineApplicationSchema>;
export type ConcludeApplicationProps = z.infer<
  typeof ConcludeApplicationSchema
>;
export type NewLineFormProps = z.infer<typeof NewLineFormSchema>;
export type AddModuleUserProps = z.infer<typeof AddModuleUserSchema>;
export type TimebaseFilterProps = z.infer<typeof TimebaseFilterSchema>;
export type AnnouncementFormProps = z.infer<typeof AnnouncementFormSchema>;
export type NewAnnouncementProps = z.infer<typeof NewAnnouncementSchema>;
export type TransferMedStorageProps = z.infer<typeof TransferMedStorageSchema>;
export type UpdateMedicineStockProps = z.infer<
  typeof UpdateMedicineStockSchema
>;
export type SignatoryFormProps = z.infer<typeof SignatoryFormSchema>;

export type TimebasedPrintProps = z.infer<typeof PrintTimebaseReport>;
export type UpdateSalaryGradeProps = z.infer<typeof UpdateSalaryGradeSchema>;
export type LineRegisterProps = z.infer<typeof LineRegisterSchema>;
export type PositionInvitationProps = z.infer<typeof PositionInvitationSchema>;
export type FillPositionProps = z.infer<typeof FillPositionSchema>;
// Department Interface
export interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  head?: User | null;
  headId?: string | null;
  users: User[];
  email?: string;
  _count: {
    users: number;
  };
}

export interface AccountProps {
  id: string;
  User: User | null;
  username: string;
  status: number;
}
// User Interface
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  suffix?: string | null;
  birthDate?: string | null;
  email: string;
  username: string;
  createdAt: string;
  level: number;
  status: string;
  sentNotifications: Notification[];
  receivedNotifications: Notification[];
  department?: Department | null;
  departmentId?: string | null;
  headedDepartment?: Department | null;
  Position?: Position | null;
  positionId?: string | null;
  SalaryGrade?: SalaryGrade | null;
  salaryGradeId?: string | null;
  Leave: Leave[];
  Announcement: Announcement[];
  region?: Region;
  province?: Province;
  municipal?: Municipal;
  barangay?: Barangay;
  lineId?: string;
  userProfilePictures: UserProfilePicture;
  modules: Module[];
  submittedApplications: SubmittedApplicationProps | undefined;
  accountId: string | undefined;
  account: AccountProps | undefined;
  PositionSlot: PositionSlotProps;
}
export interface Module {
  id: string;
  moduleName: string;
  moduleIndex: string;
  privilege: number;
  user: User;
  userId: string;
  line: LineProps;
  lineId: string;
  status: number;
}

export interface UserProfilePicture {
  id: string;
  file_name: string;
  file_size: string;
  file_type?: string | null;
  file_public_id: string;
  file_url: string;
  user?: User | null;
  timestamp: Date;
  userId?: string | null;
}

export interface AssetsProps {
  id: string;
  url: string;
  fileSize: string;
  fileType: string;
  fileName: string;
}
// Notification Interface
export interface Notification {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  recipientId: string;
  senderId: string;
  sender: User;
  recipient: User;
  path?: string | null;
  isRead: boolean;
}

// Position Interface
export interface Position {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  users: User[];
  itemNumber?: string | null;
  PositionSlot: PositionSlotProps[];
  department: Department;
  _count: {
    PositionSlot: number;
    Application: number;
  };
}

export interface PositionSlotProps {
  id: string;
  salaryGrade: SalaryGrade;
  pos: Position;
  occupied: boolean;
}
// SalaryGrade Interface
export interface SalaryGrade {
  id: string;
  grade: number;
  amount: number;
  createdAt: Date;
  users: User[];
  SalaryGradeHistory: SalaryGradeHistory[];
  _count: {
    users: number;
    SalaryGradeHistory: number;
  };
}

// SalaryGradeHistory Interface
export interface SalaryGradeHistory {
  id: string;
  userId: string;
  salaryGradeId: string;
  effectiveDate: Date;
  createdAt: Date;
  salaryGrade: SalaryGrade;
}

// Leave Interface
export interface Leave {
  id: string;
  userId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  status: string;
  createdAt: Date;
  user: User;
}

// Announcement Interface
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorId: string;
  author: User;
  status: number;
  files: AnnouncementAttachFile[];
  views: AnnouncementViews[];
  reacted: boolean;
  _count: {
    views: number;
    reactions: number;
    mentions: number;
    files: number;
  };
}

export interface HumanResourcesDashboardProps {
  employees: number;
  applications: number;
  postedJobs: number;
  vacancies: number;
  announcementsLive: number;
  announcementDraft: number;
}

export interface AnnouncementReaction {
  id: string;
  user?: User | null;
  userId?: string | null;
  announcement: Announcement;
  announcementId: string;
  reaction: number;
  timestamp: Date;
}

export interface AnnouncementViews {
  id: string;
  user?: User | null;
  userId?: string | null;
  announcement?: Announcement | null;
  announcementId?: string | null;
  timestamp: Date;
}

export interface AnnouncementMentions {
  id: string;
  announcement: Announcement;
  announcementId: string;
  user?: User | null;
  userId?: string | null;
  department?: Department | null;
  timestamp?: Date | null;
  departmentId: string;
}

export interface AnnouncementAttachFile {
  id: string;
  file_name: string;
  file_size: string;
  file_type: string;
  file_public_id: string;
  file_url: string;
  announcement: Announcement;
  timestamp: Date;
  announcementId: string;
}

export interface ProtectedRouteProps {
  token: string | undefined;
  auth: boolean;
  userId: string | null;
}

export interface Region {
  code: string;
  regionName: string;
  name: string;
  islandGroupCode: string;
  provinces: Province[];
  users: User[];
  id: string;
}

export interface Province {
  id: string;
  code: string;
  name: string;
  region?: Region;
  regionId?: number;
  municipals: Municipal[];
  users: User[];
}

export interface Municipal {
  id: string;
  code: string;
  name: string;
  province?: Province;
  provinceId?: number;
  barangays: Barangay[];
  users: User[];
}

export interface Barangay {
  code: string;
  name: string;
  municipal?: Municipal;
  municipalId?: number;
  users: User[];
  id: string;
}

export interface LineProps {
  id: string;
  barangay: Barangay;
  municipal: Municipal;
  province: Province;
  name: string;
  status: number;
  _count: {
    User: number;
  };
}

export interface InvitationLinkProps {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
  url: string;
  lineId: string;
  status: number;
  line: LineProps;
}

export type DashboardOverall = {
  accounts: number;
  barangays: number;
  lines: number;
  municipals: number;
  provinces: number;
  regions: number;
};

export interface InventoryBoxProps {
  id: string;
  name: string;
  code: number;
  createdAt: string;
  lineId: string;
  userId: string;
  departmentId?: string;
  batch: SupplyBatchProps[];
}

export interface SupplyBatchProps {
  id: string;
  suppliesId: string;
  timestamp: string;
  title: string;
  inventoryBoxId: string;
  _count: {
    SupplyStockTrack: number;
  };
}

export interface SuppliesDataSetProps {
  id: string;
  title: string;
  timestamp: string;
  lineId: string;
  inventoryBoxId: string;
  _count: {
    supplies: number;
  };
}

export interface SuppliesProps {
  id: string;
  item: string;
  description?: string | null;
  quantity: number;
  notifyAtStockOf: number;
  price: number;
  createdAt: string;
  updatedAt: Date;
  lineId: string;
  user?: User | null;
  userId?: string | null;
  condition?: string | null;
  status?: string | null;
  suppliesQualityId?: string | null;
  suppliesDataSetId?: string | null;
  code: number;
  consumable: boolean;
  refNumber: string;
}

export interface ContainerAllowedUserProps {
  id: string;
  user?: User | null; // Optional since it's marked with `?` in Prisma
  userId?: string | null; // Optional and nullable
  inventoryBoxId: string;
  grantBy: User;
  grantByUserId: string;
  timestamp: string;
}

export interface SupplyOrder {
  id: string;
  SupplyBatchOrder?: SupplyBatchOrder | null;
  supplyBatchOrderId?: string | null;
  supply: SuppliesProps;
  suppliesId: string;
  receivedQuantity: number;
  quantity: number;
  perQuantity: number;
  status: string;
  suppliesQualityId: string;
  subject?: string | null;
  desc?: string;
  condition?: string;
  refNumber: string;
  remark: any;
  price: number;
  comment?: string;
  user: User;
}

export interface SupplyPriceTrack {
  id: string;
  value: number;
  supply: SuppliesProps;
  suppliesId: string;
  timestamp: string;
  SupplyStockTrack?: SupplyStockTrack | null;
  supplyStockTrackId?: string | null;
}

export interface SupplyStockTrack {
  id: string;
  stock: number;
  supply: SuppliesProps;
  suppliesId: string;
  timestamp: Date;
  list?: SupplyBatchProps | null;
  supplyBatchId?: string | null;
  inventoryBox?: InventoryBoxProps | null;
  inventoryBoxId?: string | null;
  price: SupplyPriceTrack[];
  brand: SupplyBrandProps[];
}

export interface SupplyBrandProps {
  id: string;
  supply?: SuppliesProps | null;
  suppliesId?: string | null;
  timestamp: Date;
  supplyStockTrackId?: string | null;
  brand?: string | null;
  model?: string | null;
}

export interface SupplyBatchOrder {
  id: string;
  timestamp: string;
  title?: string | null;
  user?: User | null;
  userId?: string | null;
  status: number;
  order: SupplyOrder[];
  lineId?: string | null;
  InventoryBox?: InventoryBoxProps | null;
  inventoryBoxId?: string | null;
  refNumber: string;
  _count: {
    order: number;
  };
}

export interface SuppliesQualityProps {
  id: string;
  quality: string;
  perQuality: number;
  supplies: SuppliesProps[];
  SuppliesDataSet?: SuppliesDataSetProps | null;
  suppliesDataSetId?: string | null;
  SupplyOrder: SupplyOrder[];
}

export interface SupplyBatchAccessProps {
  id: string;
  supplyBatchId: string;
  userId: string;
  privilege: number;
  timestamp: Date;
  batch: SupplyBatchProps; // Assuming you have a SupplyBatch interface
  user: User; // Assuming you have a User interface
}

export interface OrderCompletionSelected {
  id: string;
  refNumber: string;
  quantity: number;
  condition?: string | null;
  status: string;
  brandName?: string | null;
  price?: string | null;
}

export type TimebaseGroupPriceProps = {
  id: string;
  name: string;
  firstHalfRecieved: number;
  secondhalfRecieved: number;
  firstHalfCost: number;
  secondhalfCost: number;
  firstHalfdispense: number;
  secondHalfDispense: number;
  totalQuantity: number;
  totalInsuance: number;
  totalBalanceQuantity: number;
  supplyDataSetId: string | null;
};

export type SupplierProps = {
  id: string;
  name: string;
};

export type MedicineStorage = {
  id: string;
  refNumber: string;
  name: string;
  desc: string;
  timestamp: string;
  unit: Department;
  line: LineProps;
  lineId: string;
  stocks: MedicineStock[];
  departmentId: string;
  MedicineStorageAccess: MedicineStorageAccess[];
  MedicineTransaction: MedicineTransaction[];
};

export type MedicineNotification = {
  id: string;
  title: string;
  message: string;
  unit?: Department | null;
  user: User;
  timestamp: string;
  userId: string;
  departmentId?: string | null;
  view: number;
  path?: string;
};

export type MedicineStorageAccess = {
  id: string;
  medicineStorage: MedicineStorage;
  medicineStorageId: string;
  previlege: number; // 0 - View, 1 - Edit
  user: User;
  userId: string;
  timestamp: Date;
};

export type MedicineLogs = {
  id: string;
  action: number; // 0 - Dispense, 1 - [other actions]
  message: string;
  user: User;
  timestamp: string;
  userId: string;
};

export type Medicine = {
  id: string;
  serialNumber: string;
  name: string;
  desc?: string | null;
  phase: number;
  PrecribeMedicine: PrecribeMedicine[];
  timestamp: Date;
  MedicineHistory: MedicineHistory[];
  MedicineTrack: MedicineTrack[];
  MedicineStock: MedicineStock[];
};

export type MedicineTransaction = {
  id: string;
  prescription?: Prescription | null;
  prescriptionId?: string | null;
  quantity: number;
  unit: string;
  remark: number;
  transaction: MedicineStorage;
  user: User;
  timestamp: string;
  userId: string;
  medicineStorageId: string;
  storage: MedicineStorage;
};

export type MedicineQuality = {
  id: string;
  quantity: number;
  unit: string;
  perUnit: number;
  stock?: MedicineStock | null;
  medicineStockId?: string | null;
  timestamp: Date;
};

export type MedicineStock = {
  id: string;
  quality: string;
  quantity: number;
  perQuantity: number;
  actualStock: number;
  medicine: Medicine;
  medicineId: string;
  quarter: number;
  timestamp: Date;
  stock: MedicineQuality;
  expiration?: string | null;
  price: MedicinePriceTrack;
  medicinePriceTrackId: string;
  MedicineStorage?: MedicineStorage | null;
  medicineStorageId?: string | null;
};

export type MedicineTrack = {
  id: string;
  medicine: Medicine;
  medicineId: string;
  stock: number;
  quarter: number;
  timestamp: Date;
};

export type MedicineHistory = {
  id: string;
  medicine: Medicine;
  medicineId: string;
  action: number;
  stock: number;
  message: string;
  timestamp: Date;
};

export type MedicinePriceTrack = {
  id: string;
  value: number;
  MedicineStock: MedicineStock[];
  timestamp: Date;
};

export type Prescription = {
  id: string;
  refNumber: string;
  presMed: PrecribeMedicine[];
  condtion?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  street?: string | null;
  barangay: Barangay;
  barangayId: string;
  municipal: Municipal;
  municipalId: string;
  province: Province;
  provinceId: string;
  processBy: User;
  respondedBy: User;
  userId: string;
  lineId: string;
  respondedByUserId: string;
  status: number;
  comment: PrescriptionComment[];
  remark: number;
  progress: PrescriptionProgress[];
  timestamp: string;
  assets: PrescriptionAsset[];
  MedicineTransaction: MedicineTransaction[];
};

export type PrescriptionAsset = {
  id: string;
  refNumber?: string | null;
  remark: number;
  precription: Prescription;
  prescriptionId: string;
  file_url?: string | null;
  file_size?: string | null;
  file_type?: string | null;
  timestamp: Date;
};

export type PrescriptionProgress = {
  id: string;
  step: number;
  timestamp: string;
  Prescription?: Prescription | null;
  prescriptionId?: string | null;
};

export type PrescriptionComment = {
  id: string;
  status: number;
  prescriptionSender: User;
  prescriberId: string;
  message?: string | null;
  Prescription?: Prescription | null;
  prescriptionId?: string | null;
  timestamp: Date;
  userId: string;
  User: User;
  PrescriptionCommentAssets: PrescriptionCommentAssets[];
};

export type PrescriptionCommentAssets = {
  id: string;
  file_url: string;
  file_name: string;
  file_type: number;
  file_size: string;
  timestamp: Date;
  PrescriptionComment?: PrescriptionComment | null;
  prescriptionCommentId?: string | null;
};

export type PrecribeMedicine = {
  id: string;
  medicine: Medicine;
  medicineId: string;
  timestamp: Date;
  desc?: string | null;
  quantity: number;
  Prescription?: Prescription | null;
  prescriptionId?: string | null;
  remark: string;
};

export type PrescriptionMedicine = {
  id: string;
};

export type ApplicationProps = {
  id: string;
  userId: string;
  positionId: string;
  lineId: string;
  status: string; // "pending" | "approved" | "rejected" or use enum
  createdAt: Date;
  updatedAt: Date;
  jobPostId?: string | null;

  // Relations (optional - you might want to make these optional depending on your use case)
  line?: LineProps;
  user?: User;
  position?: Position;
};

export interface SubmittedApplicationProps {
  id: string;
  lastname: string;
  firstname: string;
  middleName: string | null;
  suffix: string | null;
  birthDate: string;
  email: string;
  gender: string;
  filipino: boolean;
  dualCitizen: boolean;
  byBirth: boolean;
  byNatural: boolean;
  dualCitizenHalf: string;
  civilStatus: string;
  reshouseBlock: string | null;
  resStreet: string | null;
  resSub: string | null;
  resBarangay: string;
  resCity: string;
  resProvince: string;
  resZipCode: string;
  permahouseBlock: string | null;
  permaStreet: string | null;
  permaSub: string | null;
  permaBarangay: string;
  permaCity: string;
  permaProvince: string;
  permaZipCode: string;
  teleNo: string;
  mobileNo: string;
  height: number;
  weight: number;
  bloodType: string | null;
  umidNo: string | null;
  pagIbigNo: string | null;
  philHealthNo: string | null;
  philSys: string | null;
  tinNo: string | null;
  agencyNo: string | null;
  spouseSurname: string | null;
  spouseFirstname: string | null;
  spouseMiddle: string | null;
  spouseBusinessAddress: string | null;
  spouseTelephone: string | null;
  fatherSurname: string | null;
  fatherFirstname: string | null;
  fatherMiddlename: string | null;
  fatherOccupation: string | null;
  fatherAge: number;
  fatherBirthday: Date | null;
  fatherSuffix: string | null;
  motherSurname: string | null;
  motherFirstname: string | null;
  motherMiddlename: string | null;
  motherOccupation: string | null;
  motherAge: number;
  motherBirthday: Date | null;
  children: string;
  elementary: any | null;
  secondary: any | null;
  vocational: any | null;
  college: any | null;
  graduateCollege: any | null;
  civilService: any[];
  experience: any[];
  voluntaryWork: any[];
  learningDev: any[];
  otherInfo: any[];
  references: any[];
  govId: any;
  status: number;
  line: LineProps;
  lineId: string;
  ApplicationResponse: ApplicationResponse[];
  profilePic: ApplicationProfilePic | null;
  applicationProfilePicId: string | null;
  fileAttached: ApplicationAttachedFile[];
  timestamp: string;
  ApplicationConversation: ApplicationConversationProps[];
  batch: Date;
  forPosition: Position | null;
  positionId: string | null;
  ApplicationSkillTags: ApplicationSkillTags[];
}

interface ApplicationSkillTags {
  id: string;
  tags: string | null;
  applicant: SubmittedApplicationProps;
  submittedApplicationId: string;
  timestamp: Date;
}

interface ApplicationAttachedFile {
  id: string;
  file_url: string;
  file_name: string;
  file_type: number;
  file_size: string;
  timestamp: Date;
  SubmittedApplication: SubmittedApplicationProps | null;
  submittedApplicationId: string | null;
}

export interface ApplicationProfilePic {
  id: string;
  file_url: string;
  file_name: string;
  file_type: number;
  file_size: string;
  timestamp: Date;
  SubmittedApplication: SubmittedApplicationProps | null;
}

interface ApplicationConvoAsset {
  id: string;
  file_url: string;
  file_name: string;
  file_type: number;
  file_size: string;
  timestamp: Date;
  ApplicationConversation: ApplicationConversationProps | null;
  applicationConversationId: string | null;
}

interface ApplicationResponseAsset {
  id: string;
  file_url: string;
  file_name: string;
  file_type: number;
  file_size: string;
  timestamp: Date;
  ApplicationResponse: ApplicationResponse | null;
  applicationResponseId: string | null;
}

interface ApplicationResponse {
  id: string;
  line: LineProps;
  message: string;
  title: string;
  from: User;
  application: SubmittedApplicationProps;
  timestmap: Date;
  submittedApplicationId: string;
  lineId: string;
  userId: string;
  assets: ApplicationResponseAsset[];
}

export interface ApplicationConversationProps {
  id: string;
  message: string;
  messageContent: string;
  title: string;
  hrAdmin: User;
  fromHr: boolean;
  timestamp: string;
  applicant: SubmittedApplicationProps;
  userId: string;
  line: LineProps;
  submittedApplicationId: string;
  lineId: string;
  assets: ApplicationConvoAsset[];
}

export type UnitPositionProps = {
  id: string;
  unit: Department;
  fixToUnit: boolean;
  itemNumber: string | null;
  departmentId: string;
  position: Position;
  positionId: string;
  designation: string | null;
  slot: PositionSlotProps[];
  line: LineProps;
  timestamp: Date;
  lineId: string;
  plantilla: boolean;
  _count: {
    slot: number;
  };
};

// Base interface for JobPostRequirements
export type JobPostRequirementsProps = {
  id: string;
  title: string;
  desc?: string | null;
  asset: JobPostAssetsProps[];
  jobPostId?: string | null;
};

// Base interface for JobPostAssets
export type JobPostAssetsProps = {
  id: string;
  fileType: string;
  fileSize: string;
  fileName: string;
  fileUrl: string;
  timestamp: Date;
  jobPostRequirements?: JobPostRequirementsProps | null;
  jobPostRequirementsId?: string | null;
};

export interface JobPostProps {
  id: string;
  position: Position;
  salaryGrade?: SalaryGrade | null;
  salaryGradeId?: string | null;
  hideSG: boolean;
  slot: number;
  status: number;
  updateAt: Date;
  showApplicationCount: boolean;
  desc?: string | null;
  application: ApplicationProps[];
  requirements: JobPostRequirementsProps[];
  timestamp: string;
  positionId: string;
  location: string;
  _count: {
    application: number;
  };
  unitPos: UnitPosition;
}

export interface SupplyDispenseRecordProps {
  id: string;
  userId: string | null;
  departmentId: string | null;
  quantity: string;
  supplyStockTrackId: string;
  timestamp: string;
  remarks: string;
  suppliesId: string | null;
  dispensaryId: string | null;
  supplyBatchId: string | null;
  inventoryBoxId: string | null;

  // Relations (optional depending on how you query)
  supplyItem?: SuppliesProps;
  unit?: Department;
  supply?: SupplyStockTrack;
  user?: User;
  dispensary?: User;
  list?: SupplyBatchProps;
  container?: InventoryBoxProps;
}

export interface SupplyItemReportProps {
  id: string;
  name: string;
  firstHalfRecieved: number;
  secondhalfRecieved: number;
  firstHalfCost: number;
  secondhalfCost: number;
  firstHalfdispense: number;
  secondHalfDispense: number;
  totalQuantity: number;
  totalInsuance: number;
  totalBalanceQuantity: number;
  supplyDataSetId: string | null;
}

// Group totals for a dataset
export interface GroupTotalsProps {
  firstHalfRecieved: number;
  secondhalfRecieved: number;
  firstHalfCost: number;
  secondhalfCost: number;
  firstHalfdispense: number;
  secondHalfDispense: number;
  totalQuantity: number;
  totalInsuance: number;
  totalBalanceQuantity: number;
}

// Grouped data by dataset
export interface SupplyDataSetGroup {
  dataSetId: string;
  dataSetTitle: string;
  supplies: SupplyItemReportProps[];
  totals: GroupTotalsProps;
}

export interface SupplyTransactionProps {
  id: string;
  suppliesId: string;
  userId: string | null;
  action: number; // 0-add, 1-dispense, 2-update, 3-remove
  quantity: number;
  desc: string | null;
  timestamp: Date;
  supplyBatchId: string | null;
  lineId: string | null;
  inventoryBoxId: string | null;

  // Relations (optional based on your needs)
  supply?: SuppliesProps;
  list?: SupplyBatchProps;
  user?: User;
  line?: LineProps;
  container?: InventoryBoxProps;
}

export interface UnitPosition {
  id: string;
  departmentId: string;
  positionId: string;
  designation: string | null;
  timestamp: string;
  lineId: string;
  fixToUnit: boolean;
  itemNumber: string | null;
  plantilla: boolean;

  // Relations
  slot: PositionSlotProps[];
  unit: Department;
  line: LineProps;
  position: Position;
  jobPosts: JobPostProps[];
}

export interface FillPositionInvitationProps {
  id: string;
  lineId: string;
  email: string;
  message: string | null;
  concluded: boolean;
  concludedAt: string | null;
  timestamp: string;
  unitPositionId: string;
  line?: LineProps;
  unitPoistion?: UnitPositionProps;
  positionSlotId: string;
  step: number;
  submittedApplicationId?: string;
}

export interface LineInvitationProps {
  id: string;
  email?: string | null;
  line?: LineProps | null;
  lineId?: string | null;
  status: number; // 0 - pending, 1 - concluded
  application?: SubmittedApplicationProps | null;
  timestamp: Date;
  submittedApplicationId?: string | null;
  unitPosition: UnitPosition;
  unitPositionId: string;
  posSlot: PositionSlotProps;
  positionSlotId: string;
}
