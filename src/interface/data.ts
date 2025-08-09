import { AddNewSupplySchema, CreateListSchame, LoginSchema } from "./zod";
import {
  EmployeeFilterSchema,
  NewEmployeeSchema,
  AddPositionSchema,
  AddUnitSchema,
  AddUserSchema,
  AdminLoginSchema,
  CreateInventoryBoxSchema,
  AddNewDataSchema,
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
// Department Interface
export interface Department {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  head?: User | null;
  headId?: string | null;
  users: User[];
}

export interface AccountProps {
  id: string;
  User: User | null;
  username: string;
}
// User Interface
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  suffix?: string | null;
  birthDate?: Date | null;
  email: string;
  username: string;
  createdAt: Date;
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
}

// SalaryGrade Interface
export interface SalaryGrade {
  id: string;
  grade: number;
  amount: number;
  createdAt: Date;
  users: User[];
  SalaryGradeHistory: SalaryGradeHistory[];
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
  createdAt: Date;
  authorId: string;
  author: User;
}

export interface ProtectedRouteProps {
  token: string | undefined;
  auth: boolean;
}

export interface Region {
  code: string;
  regionName: string;
  name: string;
  islandGroupCode: string;
  provinces: Province[];
  users: User[];
}

export interface Province {
  code: string;
  name: string;
  region?: Region;
  regionId?: number;
  municipals: Municipal[];
  users: User[];
}

export interface Municipal {
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
}

export interface InvitationLinkProps {
  id: string;
  code: string;
  createdAt: Date;
  expiresAt?: string | null;
  used: boolean;
  url: string;
  lineId: string;
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
}

export interface SuppliesDataSetProps {
  id: string;
  title: string;
  timestamp: string;
  lineId: string;
  inventoryBoxId: string;
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
