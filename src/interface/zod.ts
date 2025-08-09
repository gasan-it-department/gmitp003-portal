import z from "zod";
import { he } from "zod/v4/locales";

export const LoginSchema = z.object({
  username: z.string().min(4, "Username must be at least 4 characters."),
  password: z.string().min(4, "Password must be at least 8 characters."),
});

export const EmployeeFilterSchema = z.object({
  sgFrom: z.string().optional(),
  sgTo: z.string().optional(),
  dateOrigAppoint: z.date().optional(),
  dateLastPromotion: z.date().optional(),
  level: z.string(),
});

export const NewEmployeeSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string(),
  birthDate: z.date(),
  level: z.string(),
  suffix: z.string(),
  email: z.string(),
  departmentId: z.string(),
  positionId: z.string(),
  salaryGradeId: z.string(),
});

// Example Zod schema (ensure this matches)
export const AddPositionSchema = z.object({
  title: z.string().min(4, "Title must have at least 4 characters."),
  plantilla: z.boolean(),
  itemNumber: z.string().optional(),
  slotCount: z.string(),
  level: z.string().min(1, "Level is required"),
  slot: z.array(
    z.object({
      status: z.boolean(),
      salaryGrade: z.string(),
    })
  ),
});

export const AddUnitSchema = z.object({
  name: z.string().min(4, "Name must have at least 4 characters."),
  description: z.string().optional(),
});

export const AddUserSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
    suffix: z.string().optional(),
    birthDate: z.date().optional(),
    email: z.string().min(1, "Invalid email address"),
    username: z.string().min(4, "Username must be at least 4 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    level: z.number().int().min(1, "Level must be a positive integer"),
    gender: z.enum(["male", "female"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // Shows error on confirmPassword field
  });

export const ApplicationFormSchema = z.object({
  surname: z.string().min(1, "Surname is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  birthDate: z.date().optional(),
  gender: z.enum(["male", "female"]),
  email: z.string().min(1, "Invalid email address"),
  contactNumber: z.string().optional(),
  barangayId: z.string().optional(),
  municipalityId: z.string().optional(),
  provinceId: z.string().optional(),
  streetAddress: z.string().optional(),
  civilStatus: z.enum(["single", "married", "widowed", "separated"]),
  height: z.string().optional(),
  weight: z.string().optional(),
  bloodType: z.string().optional(),
  citizenship: z.string().optional(),
  tin: z.string().optional(),
  pagIbig: z.string().optional(),
  philHealth: z.string().optional(),
  sss: z.string().optional(),
  spouseSurname: z.string().optional(),
  spouseFirstName: z.string().optional(),
  spouseMiddleName: z.string().optional(),
  spouseSuffix: z.string().optional(),
  spouseOccupation: z.string().optional(),
  spouseContactNumber: z.string().optional(),
  children: z
    .array(
      z.object({
        surname: z.string().optional(),
        firstName: z.string().optional(),
        middleName: z.string().optional(),
        suffix: z.string().optional(),
        birthDate: z.date().optional(),
      })
    )
    .optional(),
  fatherSurname: z.string().optional(),
  fatherFirstName: z.string().optional(),
  fatherMiddleName: z.string().optional(),
  fatherSuffix: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherContactNumber: z.string().optional(),
  motherSurname: z.string().optional(),
  motherFirstName: z.string().optional(),
  motherMiddleName: z.string().optional(),
  motherSuffix: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherContactNumber: z.string().optional(),
  elementaty: z
    .object({
      name: z.string().optional(),
      from: z.string(),
      to: z.string(),
      highestLevelAttained: z.string().optional(),
      yearGraduated: z.string().optional(),
      achieved: z.string().optional(),
    })
    .optional(),
  secondary: z
    .object({
      name: z.string().optional(),
      from: z.string(),
      to: z.string(),
      highestLevelAttained: z.string().optional(),
      yearGraduated: z.string().optional(),
      achieved: z.string().optional(),
    })
    .optional(),
  vocational: z
    .object({
      name: z.string().optional(),
      from: z.string(),
      to: z.string(),
      highestLevelAttained: z.string().optional(),
      yearGraduated: z.string().optional(),
      achieved: z.string().optional(),
    })
    .optional(),
  college: z
    .object({
      name: z.string().optional(),
      from: z.string(),
      to: z.string(),
      highestLevelAttained: z.string().optional(),
      yearGraduated: z.string().optional(),
      achieved: z.string().optional(),
    })
    .optional(),
  graduateStudies: z
    .object({
      name: z.string().optional(),
      from: z.string(),
      to: z.string(),
      highestLevelAttained: z.string().optional(),
      yearGraduated: z.string().optional(),
      achieved: z.string().optional(),
    })
    .optional(),
  eligibility: z.array(
    z.object({
      title: z.string().optional(),
      rating: z.string().optional(),
      dateExamination: z.string().optional(),
      place: z.string().optional(),
      licenseNumber: z.string().optional(),
      licenseValidity: z.string().optional(),
    })
  ),
});

export const AdminLoginSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(8, "Password must at least have 8 characters"),
});

export const CreateInventoryBoxSchema = z.object({
  name: z.string().min(3, "The container must at leat have 3 characters"),
});

export const CreateListSchame = z.object({
  title: z.string().min(4, "List must at least have 4 characters."),
});

export const AddNewDataSchema = z.object({
  title: z.string().min(3, "Title must at least 3 characters."),
});

export const AddNewSupplySchema = z.object({
  name: z.string().min(2, "Name must be at least have 2 characters"),
  comsumable: z.boolean(),
  desc: z.string(),
});
