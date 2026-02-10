import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
//
import { BrowserRouter, Route, Routes } from "react-router";
import Login from "./route/Login.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//provider
import ProtectedRoute from "./provider/ProtectedRoute.tsx";
import UserProvider from "./provider/UserProvider.tsx";
import Unauthorized from "./provider/Unauthorized.tsx";
import TempAuthProvider from "./provider/TempAuthProvider.tsx";
//route
import HrInex from "@/route/human_resources/index.tsx";
import HrEmployee from "./route/human_resources/Employee.tsx";
import HrApplication from "./route/human_resources/Application.tsx";
import AddEmployee from "./route/human_resources/AddEmployee.tsx";
import Invite from "./route/human_resources/Invite.tsx";
import SalaryGrade from "./route/human_resources/SalaryGrade.tsx";
import Areas from "./route/human_resources/Areas.tsx";
import Department from "./route/human_resources/Department.tsx";
import Office from "./route/human_resources/Office.tsx";
import AccountSetup from "./route/AccountSetup.tsx";
import InviteLink from "./route/human_resources/InviteLink.tsx";
import Home from "./route/supplies/Home.tsx";
import SupplyIndex from "./layout/supplies/Index.tsx";
import AdminLogin from "./layout/AdminLogin.tsx";
import AdminPanel from "./route/AdminPanel.tsx";
import ContainterList from "./route/supplies/ContainterList.tsx";
import Container from "./layout/supplies/Container.tsx";
import DataSetConfig from "./layout/supplies/DataSetConfig.tsx";
import DataSet from "./route/supplies/DataSet.tsx";
import Accessibility from "./layout/supplies/Accessibility.tsx";
import AddAccess from "./layout/supplies/AddAccess.tsx";
import CustomList from "./route/supplies/CustomList.tsx";
import NewSupplyOrder from "./route/supplies/NewSupplyOrder.tsx";
import OrderCompletion from "./route/supplies/OrderCompletion.tsx";
import InventoryInbox from "./layout/supplies/InventoryInbox.tsx";
import SupplyItem from "./route/supplies/SupplyItem.tsx";
import JobPost from "./layout/human_resources/JobPost.tsx";
import JobPostData from "./route/human_resources/JobPostData.tsx";
import PostPosition from "./route/human_resources/PostPosition.tsx";
import PostJobForm from "./layout/human_resources/PostJobForm.tsx";
import ApplicationForm from "./route/human_resources/ApplicationForm.tsx";
import PublicApplication from "./route/human_resources/PublicApplication.tsx";
import ApplicationInfo from "./route/human_resources/ApplicationInfo.tsx";
import NewUser from "./route/NewUser.tsx";
import ModuleHome from "./layout/human_resources/module/ModuleHome.tsx";
import ModuleUsers from "./layout/human_resources/module/ModuleUsers.tsx";
import AddModuleUser from "./route/module/AddModuleUser.tsx";
import UserProfile from "./layout/human_resources/UserProfile.tsx";
import ResetUserPassword from "./route/human_resources/ResetUserPassword.tsx";
import Announcement from "./route/human_resources/Announcement.tsx";
import AnnouncementData from "./route/human_resources/AnnouncementData.tsx";
import AnnouncementDataPublic from "./layout/AnnouncementData.tsx";
import UnitDispenseRecord from "./layout/supplies/UnitDispenseRecord.tsx";
import Dashboard from "./layout/human_resources/Dashboard.tsx";
import LineRegistration from "./route/LineRegistration.tsx";
import PositionInvitation from "./route/PositionInvitation.tsx";
//E-signature
import EsignIndex from "./route/e-sign/Index.tsx";
import EsignHomePannel from "./route/e-sign/HomePannel.tsx";
import Dissemination from "./route/e-sign/Dissemination.tsx";
import DisseminationIndex from "./route/e-sign/DisseminationIndex.tsx";
import NewDisseminationRoom from "./route/e-sign/NewDisseminationRoom.tsx";
import DocSelection from "./layout/e-sign/DocSelection.tsx";
//Medicine
import MedicineIndex from "./route/medicine/Index.tsx";
import StorageList from "./route/medicine/StorageList.tsx";
import Storage from "./layout/medicine/Storage.tsx";
import StorageConfig from "./route/medicine/StorageConfig.tsx";
import StorageMedUpdate from "./layout/medicine/StorageMedUpdate.tsx";
import History from "./route/medicine/History.tsx";
import PrescriptionData from "./route/medicine/PrescriptionData.tsx";
//Prescribe
import PrescribeIndex from "./route/prescribe/Index.tsx";
import PrescribeHome from "./route/prescribe/PrescribeHome.tsx";
import PrescribedData from "./layout/prescribe/PrescribedData.tsx";
//
import AdminPage from "./route/admin/Index.tsx";
import AdminHome from "./layout/admin/Home.tsx";
//
import { Toaster } from "./components/ui/sonner.tsx";
import AdminRouter from "./provider/AdminRouter.tsx";
import Test from "./route/Test.tsx";
import PurchaseRequest from "./layout/supplies/PurchaseRequest.tsx";
import DispenseRecordData from "./layout/supplies/DispenseRecordData.tsx";
import UserDispenseRecord from "./layout/supplies/UserDispenseRecord.tsx";
import UserDataRegistration from "./route/UserDataRegistration.tsx";
import LineUserInfoRegister from "./layout/LineUserInfoRegister.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="line/register/user/:lineId/:lineInvitationId/:unitPosId/:sgId"
              element={<LineUserInfoRegister />}
            />
            <Route
              path="line/register/:lineInvitationId/:lineId/:unitPosId/:sgId"
              element={<LineRegistration />}
            />
            <Route
              path="position/register/:positionInviteLinkId"
              element={<UserDataRegistration />}
            />

            <Route
              path="position/register/:positionInviteLinkId/:linkApplicationId"
              element={<PositionInvitation />}
            />
            <Route path="/auth" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-panel" element={<AdminRouter />}>
              <Route index={true} element={<AdminPanel />} />
            </Route>
            <Route
              path="/public/:lineId/reset-password/:resetLinkId/:accountId"
              element={<ResetUserPassword />}
            />
            <Route
              path="/public/:lineId/application/:applicationId"
              element={<NewUser />}
            />
            <Route path="/invitation/:invitationId" element={<InviteLink />} />
            <Route path="/job-post/:municipalId" element={<JobPost />} />
            <Route path="/public" element={<TempAuthProvider />}>
              <Route
                path="application/:applicationId"
                element={<PublicApplication />}
              />
            </Route>
            <Route
              path="/job-post/:municipalId/form/:jobPostId"
              element={<ApplicationForm />}
            />
            <Route
              element={
                <Unauthorized>
                  <ProtectedRoute />
                </Unauthorized>
              }
            >
              <Route path="/" element={<Test />} />
              <Route path="/:lineId" element={<App />}>
                <Route index={true} element={<SupplyIndex />} />
                <Route
                  path="announcement/:announcementDataId"
                  element={<AnnouncementDataPublic />}
                />
              </Route>
              <Route path="/:lineId/admin" element={<AdminPage />}>
                <Route index={true} element={<AdminHome />} />
              </Route>
              <Route />
              <Route path="/:lineId/supplies" element={<Home />}>
                <Route index={true} element={<ContainterList />} />
                <Route
                  path="/:lineId/supplies/inbox/:inboxId"
                  element={<InventoryInbox />}
                />
                <Route
                  path="/:lineId/supplies/inbox/pr/:purchaseReqId"
                  element={<PurchaseRequest />}
                />
                <Route path="container/:containerId" element={<Container />} />
                <Route
                  path="container/:containerId/add-accessibility"
                  element={<AddAccess />}
                />
                <Route
                  path="container/:containerId/data-set-config"
                  element={<DataSetConfig />}
                />
                <Route
                  path="container/:containerId/accessibility"
                  element={<Accessibility />}
                />
                <Route
                  path="container/:containerId/data-set-config/:dataSetId"
                  element={<DataSet />}
                />
                <Route
                  path="container/:containerId/list/:listId"
                  element={<CustomList />}
                />
                <Route
                  path="container/:containerId/list/:listId/transaction/:transactionId"
                  element={<DispenseRecordData />}
                />
                <Route
                  path="container/:containerId/list/:listId/transaction/:unitRecipientId/unit-record"
                  element={<UnitDispenseRecord />}
                />
                <Route
                  path="container/:containerId/list/:listId/transaction/:userRecipientId/user-record"
                  element={<UserDispenseRecord />}
                />
                <Route
                  path="container/:containerId/list/:listId/order/:orderId"
                  element={<NewSupplyOrder />}
                />
                <Route
                  path="container/:containerId/list/:listId/order/:orderId/completion"
                  element={<OrderCompletion />}
                />
                <Route
                  path="container/:containerId/list/:listId/item/:itemId"
                  element={<SupplyItem />}
                />
              </Route>
              <Route
                path="/:lineId/prescribe-medicine"
                element={<PrescribeIndex />}
              >
                <Route index={true} element={<PrescribeHome />} />
                <Route
                  path="transaction/:prescribedDataId"
                  element={<PrescribedData />}
                />
              </Route>
              <Route path="/:lineId/medicine" element={<MedicineIndex />}>
                <Route index={true} element={<StorageList />} />
                <Route path="storage/:storageId" element={<Storage />} />
                <Route path="config" element={<StorageConfig />} />
                <Route path="logs" element={<History />} />
                <Route
                  path="prescription/:prescriptionId"
                  element={<PrescriptionData />}
                />
                <Route
                  path="storage/:storageId/update"
                  element={<StorageMedUpdate />}
                />
              </Route>
              <Route path="/:lineId/human-resources" element={<HrInex />}>
                <Route path="announcement" element={<Announcement />} />
                <Route
                  path="announcement/:announcementId"
                  element={<AnnouncementData />}
                />
                <Route index={true} path="dashboard" element={<Dashboard />} />
                <Route path="employee" element={<HrEmployee />} />
                <Route path="employee/:employeeId" element={<UserProfile />} />
                <Route path="employees/add" element={<AddEmployee />} />
                <Route path="application" element={<HrApplication />} />
                <Route path="module" element={<ModuleHome />} />
                <Route
                  path="module/:moduleId/users"
                  element={<ModuleUsers />}
                />
                <Route
                  path="module/:moduleId/users/add"
                  element={<AddModuleUser />}
                />
                <Route
                  path="application/:applicationId"
                  element={<ApplicationInfo />}
                />
                <Route path="salary" element={<SalaryGrade />} />
                <Route path="areas" element={<Areas />} />
                <Route path="units" element={<Department />} />
                <Route path="invite" element={<Invite />} />
                <Route path="application/post" element={<PostPosition />} />
                <Route
                  path="application/post/:positionPostId"
                  element={<PostJobForm />}
                />
                <Route path="units/:officeID" element={<Office />} />
                <Route path="job-post/:jobPostId" element={<JobPostData />} />
              </Route>
              <Route path="/:lineId/documents" element={<EsignIndex />}>
                <Route index={true} element={<EsignHomePannel />} />
                <Route path="dissemination" element={<DisseminationIndex />}>
                  <Route index={true} element={<Dissemination />} />
                  <Route
                    path="set-up/:newRoomId/file"
                    element={<DocSelection />}
                  />
                  <Route
                    path="set-up/:newRoomId"
                    element={<NewDisseminationRoom />}
                  />
                </Route>
              </Route>
              <Route path="/account-setup" element={<AccountSetup />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
    <Toaster />
  </StrictMode>,
);
