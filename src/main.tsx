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
//route
import HrInex from "@/route/human_resources/index.tsx";
import HrHome from "./route/human_resources/Home.tsx";
import HrPlantilla from "./route/human_resources/Plantilla.tsx";
import HrEmployee from "./route/human_resources/Employee.tsx";
import HrApplication from "./route/human_resources/Application.tsx";
import AddEmployee from "./route/human_resources/AddEmployee.tsx";
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
//
import { Toaster } from "./components/ui/sonner.tsx";
import AdminRouter from "./provider/AdminRouter.tsx";
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-panel" element={<AdminRouter />}>
              <Route index={true} element={<AdminPanel />} />
            </Route>
            <Route path="/invitation/:invitationId" element={<InviteLink />} />
            <Route
              element={
                <Unauthorized>
                  {" "}
                  <ProtectedRoute />
                </Unauthorized>
              }
            >
              <Route path="/" />
              <Route path="/:lineId" element={<App />}>
                <Route index={true} element={<SupplyIndex />} />
              </Route>
              <Route path="/:lineId/supplies" element={<Home />}>
                <Route index={true} element={<ContainterList />} />
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
              </Route>

              <Route path="/:lineId/human-resources" element={<HrInex />}>
                <Route index={true} path="home" element={<HrHome />} />
                <Route path="plantilla" element={<HrPlantilla />} />
                <Route path="employees" element={<HrEmployee />} />
                <Route path="employees/add" element={<AddEmployee />} />
                <Route path="application" element={<HrApplication />} />
                <Route path="salary" element={<SalaryGrade />} />
                <Route path="areas" element={<Areas />} />
                <Route path="groups" element={<Department />} />
                <Route path="groups/office/:officeID" element={<Office />} />
              </Route>
              <Route path="/account-setup" element={<AccountSetup />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </QueryClientProvider>
    <Toaster />
  </StrictMode>
);
