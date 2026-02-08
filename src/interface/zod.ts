import z from "zod";

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
  designation: z.string(),
  plantilla: z.boolean(),
  itemNumber: z.string().optional(),
  slotCount: z.string(),
  level: z.string().min(1, "Level is required"),
  exclusive: z.boolean(),
  slot: z.array(
    z.object({
      status: z.boolean(),
      salaryGrade: z.string(),
    }),
  ),
});

export const AddUnitSchema = z.object({
  name: z.string().min(4, "Name must have at least 4 characters."),
  description: z.string().optional(),
});

export const EducationalSchema = z.object({
  name: z.string().optional(),
  from: z.string(),
  to: z.string(),
  course: z.string(),
  highestAttained: z.string(),
  yearGraduate: z.string(),
  records: z.string(),
});

export const ParentSchema = z.object({
  surname: z.string().min(1, "Surname is required"),
  firstname: z.string().min(1, "Firstname is required"),
  middle: z.string().optional(),
  occupation: z.string().optional(),
  age: z.string().optional(),
  birthdate: z.date().optional(),
  suffix: z.string().optional(),
});

export const ChildrenSchema = z.object({
  fullname: z.string(),
  dateOfBirth: z.date().optional(),
  id: z.string(),
});

export const EligibilitySchema = z.object({
  id: z.string(),
  title: z.string(),
  rating: z.string().optional(),
  dateExami: z.string().optional(),
  placeOfExam: z.string(),
  licenceNumber: z.string(),
  licenceValidity: z.date().optional(),
});

export const WorkExprienceSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  position: z.string(),
  department: z.string(),
  status: z.string(),
  govService: z.boolean(),
});

export const AddressSchema = z.object({
  blockno: z.string().optional(),
  street: z.string().optional(),
  subVillage: z.string().optional(),
  barangay: z.string().min(1, "Barangay is required"),
  cityMunicipality: z.string().min(1, "City/Municipality is requried"),
  province: z.string().min(1, "Province is required"),
  regionCode: z.string().min(1, "Region is required"),
  zipCode: z.string().optional(),
});

export const CitizenshipSchema = z.object({
  citizenship: z.string(),
  by: z.string(),
  country: z.string().optional(),
});

export const ApplicantTagsSchema = z.object({
  tag: z.string(),
  cont: z.string(),
});

export const ReferenceSchema = z.object({
  name: z.string(),
  residentialAddress: z.string(),
  contact: z.string().optional(),
});

export const AddUserSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    middleName: z.string().optional(),
    suffix: z.string().optional(),
    birthDate: z.date().optional(),
    email: z.string().min(1, "Invalid email address"),
    gender: z.string().min(1, "Gender is required"),
    citizenship: CitizenshipSchema,
    civilStatus: z.string().min(1, "Civil Status is required"),
    residentialAddress: AddressSchema,
    permanentAddress: AddressSchema,
    telephoneNumber: z.string(),
    mobileNo: z.string().min(11, "Mobile No. is required"),
    height: z
      .string()
      .min(1, "Height is required")
      .max(300, "Max height reached"),
    weight: z.string().min(1, "Weight is required"),
    bloodType: z.string().min(1, "Blood Type is required"),
    umidNo: z.string().optional(),
    pagIbigNo: z.string().optional(),
    philHealthNo: z.string().optional(),
    philSys: z.string().optional(),
    tinNo: z.string().optional(),
    agencyNo: z.string().optional(),
    spouseSurname: z.string().optional(),
    spouseFirstname: z.string().optional(),
    spouseMiddle: z.string().optional(),
    spouseBusinessAddress: z.string().optional(),
    spouseTelephone: z.string().optional(),
    father: ParentSchema,
    mother: ParentSchema,
    children: z.array(ChildrenSchema),
    elementary: EducationalSchema.optional(),
    secondary: EducationalSchema.optional(),
    vocational: EducationalSchema.optional(),
    college: EducationalSchema.optional(),
    graduateCollege: EducationalSchema,
    civiService: z.array(EligibilitySchema).optional(),
    experience: z.array(WorkExprienceSchema).optional(),
    tags: z.array(ApplicantTagsSchema),
    assets: z.array(
      z.object({
        file: z.file(),
        title: z.string(),
      }),
    ),
    profilePicture: z.file().optional(),
    // refOne: ReferenceSchema.optional(),
    // refTwo: ReferenceSchema.optional(),
    // refThree: ReferenceSchema.optional(),
    // govId: z
    //   .object({
    //     goveIssuedID: z.string(),
    //     idNo: z.string(),
    //     dateIssuance: z.string(),
    //   })
    //   .optional(),
  })
  .refine(
    (data) => {
      if (!data.birthDate) {
        return false;
      }

      const today = new Date();
      const birthDate = new Date(data.birthDate);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age >= 18;
    },
    {
      message: "Must be at least 18 years old",
      path: ["birthDate"], // Specify the field this error applies to
    },
  );

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
      }),
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
    }),
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

export const NewOrderSchema = z.object({
  title: z.string().optional(),
});

export const AddNewSupplySchema = z.object({
  name: z.string().min(2, "Name must be at least have 2 characters"),
  comsumable: z.boolean(),
  desc: z.string().optional(),
});

export const AddItemOrderSchema = z.object({
  desc: z.string().optional(),
  quantity: z.string().refine(
    (val) => {
      if (val === "0") {
        return false;
      }
      return true;
    },
    { path: ["quantity"], message: "Invalid quantity" },
  ),
  unit: z.string(),
});

export const UpdateOrderItenSchema = z.object({
  quantity: z.string(),
  desc: z.string().optional(),
});

export const FullfillItemOrderSchema = z.object({
  brandName: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required"),
  comment: z.string().optional(),
  condition: z.enum(["new", "good", "for repair", "defective"]).optional(),
  noBrand: z.boolean().default(true),
});

export const DispenseItemSchema = z.object({
  unitId: z.string().optional(),
  userId: z.string().optional(),
  desc: z.string().optional(),
  quantity: z
    .string()
    .min(1, "Quantity is required")
    .refine(
      (val) => {
        // Parse as integer to check if it's a valid whole number
        const num = parseInt(val, 10);

        // Check if it's a valid integer
        if (isNaN(num)) {
          return false;
        }

        // Check if it's positive
        if (num <= 0) {
          return false;
        }

        // Check if it contains a decimal point
        if (val.includes(".")) {
          return false;
        }

        // Check if it contains comma (some locales use comma as decimal)
        if (val.includes(",")) {
          return false;
        }

        const floatNum = parseFloat(val);
        if (!Number.isInteger(floatNum)) {
          return false;
        }

        return true;
      },
      {
        message:
          "Quantity must be a positive whole number (no decimals allowed)",
      },
    ),
  toAccount: z.boolean(),
  address: z.string(),
});

export const RefineTimebaseSchema = z.object({
  min: z.string().optional(),
  max: z.string().optional(),
  minStock: z.string().optional(),
  maxStock: z.string().optional(),
  consumable: z.boolean(),
});

export const RefinePeopleListSchema = z.object({
  status: z.enum(["active", "inactive", "all"]).optional(),
  level: z
    .enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "all"])
    .optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  year: z.string().optional(),
});

export const CreateInviteLinkSchema = z.object({
  expireDate: z.string(),
  time: z.string().optional(),
});

export const PurchaseReqSchema = z.object({
  item: z.string(),
  desc: z.string(),
  quantity: z.string(),
  unitCost: z.string(),
  totalCost: z.string(),
  remark: z.string(),
  comment: z.string(),
});

export const NewStorageLocationSchema = z.object({
  name: z.string().min(3, "Name must at least have 3 characters."),
  desc: z.string().optional(),
  departmentId: z.string(),
});

export const AddNewMedicineSchema = z.object({
  name: z.string(),
  desc: z.string().optional(),
});

export const MedicineActionSchema = z.object({
  unitId: z.string().min(1, "Unit is required."),
});

export const AddStorageMedSchema = z.object({
  medicineId: z.string(),
  unitOfmeasure: z.string(),
  quantity: z.string(),
  thresHold: z.string(),
  perUnit: z.string(),
  expiration: z.string(),
  addressRoom: z.string().optional(),
  addressCol: z.string().optional(),
  addressRow: z.string().optional(),
  addressSec: z.string().optional(),
  container: z.string().optional(),
});

export const PrescribeMedRes = z.object({
  quantityDispense: z.string(),
});

export const DispensarySchema = z.object({
  firstname: z.string().min(4, "Minimum of 4 characters"),
  lastname: z.string().min(4, "Minimum of 4 characters"),
  age: z.string(),
  barangay: z.string().min(1, "Barangay is required"),
  municipal: z.string().min(1, "Municipal is required"),
  province: z.string().min(1, "Province is required"),
  region: z.string().min(1, "Region is required"),
  street: z.string().optional(),
  desc: z.string().optional(),
  prescribeMed: z
    .array(
      z.object({
        medId: z.string(),
        quantity: z.string(),
        comment: z.string(),
        medName: z.string(),
      }),
    )
    .min(1, "Prescribe at least one (1) medicine"),
  //assets: z.file(),
});

export const PrecribeMedSchema = z.object({
  quantity: z.string(),
  comment: z.string().optional(),
});

export const ReleasePrescribeMedItemSchema = z
  .object({
    quantity: z.string(),
    prescribeQuantity: z.string(),
    remark: z.string(),
    medId: z.string(),
    id: z.string(),
    label: z.string(),
    currentStock: z.string(),
    stocks: z.array(
      z.object({
        id: z.string(),
        quantity: z.string(),
        expireIn: z.string().optional(),
        toRelease: z.string(),
      }),
    ),
  })
  .refine(
    (data) => {
      const currentStock = parseInt(data.currentStock, 10);
      if (currentStock < 10 && data.remark !== "OK") {
        return true;
      }
      if (data.remark !== "OK" && data.quantity !== "0" && currentStock > 10) {
        return false;
      }
      return true;
    },
    { message: "Invalid Remark", path: ["remark"] },
  );
// .refine(
//   (data) => {
//     const quantity = parseInt(data.currentStock, 10);
//     const prescribeQuantity = parseInt(data.prescribeQuantity, 10);
//     if (quantity < prescribeQuantity) return false;
//     return true;
//   },
//   { message: "", path: ["quantity"] }
// );

export const ReleasePrescribeMedSchema = z.object({
  prescribeMed: z.array(ReleasePrescribeMedItemSchema),
});

export const JobApplicationRequirements = z.object({
  title: z.string().min(4, "Minimum at least 4 characters."),
  assets: z.array(z.file()),
});

export const PostJobApplicationSchema = z.object({
  positions: z.object({
    desc: z.string(),
    hideSG: z.boolean(),
    showApplicationCount: z.boolean(),
    requirements: z.array(JobApplicationRequirements),
    salaruGrade: z.string().optional(),
    deadline: z.string().optional(),
  }),
});

export const AddExistingPosition = z
  .object({
    itemNumber: z.string().optional(),
    designation: z.string().optional(),
    plantilla: z.boolean(),
    slot: z.array(
      z.object({
        salaryGrade: z.string().min(1, "Salary Grade is required"),
        occupied: z.boolean(),
      }),
    ),
  })
  .refine(
    (data) => {
      if (data.slot.length === 0) {
        return false;
      }
      return true;
    },
    { message: "At least one (1) slot is required!", path: ["slot"] },
  );

export const ContactApplicationSchema = z.object({
  message: z.string().min(10, "Message must at least have 10 characters."),
  sendTo: z.string(),
  subject: z.string().min(4, "Subject must at least have 4 characters."),
});

export const RefineApplicationSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  positionId: z.string().optional(),
  tags: z.array(z.object({ cont: z.string(), tag: z.string() })),
});

export const SendApplicationMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
  file: z.array(z.file()).optional(),
});

export const NewUserSchema = z
  .object({
    username: z.string().min(4, "Username must be at least 4 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ConcludeApplicationSchema = z.object({
  sendInviteLink: z.boolean(),
  accepted: z.boolean(),
});

export const AddModuleUserSchema = z.object({
  previlege: z.string(),
});

export const NewLineFormSchema = z.object({
  name: z.string().min(4, "Must at least minimum of 4 characters."),
  barangay: z.string(),
  municipal: z.string(),
  province: z.string(),
  region: z.string(),
  defaultUserEmail: z
    .string()
    .min(1, "Email is required")
    // Optional: add additional constraints
    .refine(
      (email) => {
        // Basic but more complete regex pattern
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      {
        message: "Invalid email format",
      },
    ),
});

export const TimebaseFilterSchema = z.object({
  year: z.string(),
  period: z.string(),
});

export const AnnouncementFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  // status: z.enum(["draft", "published", "scheduled", "archived"]),
  mentions: z
    .array(
      z.object({
        username: z.string(),
        id: z.string(),
        firstname: z.string(),
        lastname: z.string(),
      }),
    )
    .optional(),
  //files: z.array(z.file().optional()),
});

export const NewAnnouncementSchema = z.object({
  title: z.string().min(1, "Minimum at least 4 characters"),
});

export const TransferMedStorageSchema = z.object({
  departId: z.string(),
  quantity: z.string(),
});

export const UpdateMedicineStockSchema = z.object({
  quantity: z.string(),
  perQuantity: z.string(),
});

export const PrintTimebaseReport = z.object({
  years: z.array(z.string()).min(1, "Select year"),
  period: z.array(z.string()).min(1, "Select period"),
});

export const SignatoryFormSchema = z.object({
  address: z.string().min(1, "Address is required"),
  receivers: z
    .array(
      z.object({
        userId: z.string(),
        firstname: z.string(),
        lastname: z.string(),
        username: z.string(),
      }),
    )
    .min(1, "Select at least one receiver"),
  signature: z
    .union([z.instanceof(File).optional(), z.string().optional()])
    .refine((value) => value !== undefined && value !== null && value !== "", {
      message: "Signature is required",
    }),
});

export const UpdateSalaryGradeSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
});

export const LineRegisterSchema = z.object({
  firstname: z.string().min(2, "First name is required"),
  lastname: z.string().min(2, "Last name required"),
  username: z.string().min(4, "Username is required"),
  password: z.string().min(8, "Must at least have 8 characters"),
  viewPassword: z.boolean(),
  teleNumber: z.string().optional(),
  email: z
    .string()
    .min(1, "Email is required")
    .refine(
      (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      {
        message: "Invalid email format",
      },
    ),
  personalEmail: z
    .string()
    .min(1, "Email is required")
    .refine(
      (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      },
      {
        message: "Invalid email format",
      },
    ),
  personalPhoneNumber: z.string().optional(),
});

export const PositionInvitationSchema = z.object({
  slot: z.string().min(1, "Slot is required"),
  mail: z.string().refine(
    (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
    {
      message: "Invalid email format",
    },
  ),
  message: z.string().optional(),
});

export const FillPositionSchema = z.object({
  username: z.string().min(4, "Username is required"),
  password: z.string().min(8, "Must at least have 8 characters"),
  viewPassword: z.boolean(),
});
