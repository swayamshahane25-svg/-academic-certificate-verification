import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import VerifyCertificate from "./pages/VerifyCertificate";
import IssueCertificate from "./pages/IssueCertificate";
import RevokeCertificate from "./pages/RevokeCertificate";
import Dashboard from "./pages/Dashboard";
import StudentPortal from "./pages/StudentPortal";
import FraudDetection from "./pages/FraudDetection";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccessDenied from "./pages/AccessDenied";
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Profile from "./pages/Profile";
import Home from "./pages/Home";

function AuthRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading account...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user.role === "ISSUER") return <Navigate to="/dashboard" replace />;
  if (user.role === "STUDENT") return <Navigate to="/student-dashboard" replace />;

  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/student" element={<StudentPortal />} />
          <Route path="/fraud-detection" element={<FraudDetection />} />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={["ADMIN", "ISSUER"]}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/issue" element={
            <ProtectedRoute allowedRoles={["ADMIN", "ISSUER"]}>
              <IssueCertificate />
            </ProtectedRoute>
          } />

          <Route path="/revoke" element={
            <ProtectedRoute allowedRoles={["ADMIN", "ISSUER"]}>
              <RevokeCertificate />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="/student-dashboard" element={
            <ProtectedRoute allowedRoles={["STUDENT"]}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={["ADMIN", "ISSUER", "STUDENT"]}>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/auth-redirect" element={<AuthRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;