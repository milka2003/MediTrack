 // src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import PatientLoginPage from "./pages/PatientLoginPage";
import Dashboard from "./pages/admin/Dashboard";  // Admin Dashboard Layout
import ProtectedRoute from "./components/ProtectedRoute";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import PharmacyDashboard from "./pages/pharmacy/Dashboard";
import MedicineMaster from "./pages/pharmacy/MedicineMaster";
import Prescriptions from "./pages/pharmacy/Prescriptions";
import PharmacyReports from "./pages/pharmacy/Reports";
import AdminReports from "./pages/admin/Reports";
import LabDashboard from "./pages/LabDashboard";
import LabTestMaster from "./pages/lab/LabTestMaster";
import PendingTestsReport from "./pages/lab/PendingTestsReport";
import CompletedTestsReport from "./pages/lab/CompletedTestsReport";
import DoctorDashboard from "./pages/DoctorDashboard";
import NurseDashboard from "./pages/NurseDashboard";
import BillingDashboard from "./pages/BillingDashboard";
import ChangePassword from "./pages/ChangePassword";
import Departments from "./pages/admin/Departments";
import Services from "./pages/admin/Services";
import Doctors from "./pages/admin/Doctors";

// Patient Portal
import PatientDashboard from "./pages/patient/Dashboard";
import PatientProfile from "./pages/patient/Profile";
import PatientVisits from "./pages/patient/Visits";
import PatientLabReports from "./pages/patient/LabReports";
import PatientPrescriptions from "./pages/patient/Prescriptions";
import PatientBills from "./pages/patient/Bills";

// ✅ Now AddStaff is imported
import AddStaff from "./pages/admin/AddStaff"; 
import Staff from "./pages/admin/Staff";
import AdminOverview from "./pages/admin/AdminOverview";
import MLDashboard from "./pages/MLDashboard";
// Later you can add these when ready
// import Reports from "./pages/admin/Reports";
// import Doctors from "./pages/admin/Doctors";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/patient-login" element={<PatientLoginPage />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Admin Dashboard with nested routes */}
        <Route path="/dashboard" element={<ProtectedRoute roles={["Admin"]}><Dashboard /></ProtectedRoute>}>
          <Route path="add-staff" element={<AddStaff />} />
          <Route path="staff" element={<Staff />} />
          <Route path="departments" element={<Departments />} />
          <Route path="services" element={<Services />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="reports" element={<AdminReports />} />
          {/* Default index → Overview */}
          <Route index element={<AdminOverview />} />
        </Route>

        {/* Patient Portal - Protected with patient authentication */}
        <Route path="/patient-portal" element={
          <ProtectedRoute roles={["Patient"]}>
            <PatientDashboard />
          </ProtectedRoute>
        }>
          <Route path="visits" element={<PatientVisits />} />
          <Route path="lab-reports" element={<PatientLabReports />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="bills" element={<PatientBills />} />
          <Route index element={<PatientProfile />} />
        </Route>

        {/* Other Roles */}
        <Route path="/reception-dashboard/*" element={<ReceptionDashboard />} />
        {/* New Pharmacy Dashboard with Drawer and nested routes */}
        <Route path="/pharmacy" element={<PharmacyDashboard />}>
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="medicine-master" element={<MedicineMaster />} />
          <Route path="reports" element={<PharmacyReports />} />
          <Route index element={<Prescriptions />} />
        </Route>

        {/* Old simple PharmacistDashboard redirected to new Pharmacy layout */}
        <Route path="/pharmacist-dashboard" element={<Navigate to="/pharmacy" replace />} />
        <Route path="/lab-dashboard" element={<LabDashboard />} />
        <Route path="/lab-dashboard/tests" element={<LabTestMaster />} />
        <Route path="/lab-dashboard/reports/pending" element={<PendingTestsReport />} />
        <Route path="/lab-dashboard/reports/completed" element={<CompletedTestsReport />} />
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/nurse-dashboard" element={<NurseDashboard />} />
        <Route path="/billing-dashboard" element={<BillingDashboard />} />
        <Route path="/ml-dashboard" element={<ProtectedRoute roles={["Lab"]}><MLDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
