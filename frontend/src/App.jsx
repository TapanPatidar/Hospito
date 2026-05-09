import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import PharmacistDashboard from "./pages/PharmacistDashboard";

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF9F6" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-green-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-stone-500 text-sm">Loading Hospito...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (user === undefined) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "patient") return <PatientDashboard />;
  if (user.role === "doctor") return <DoctorDashboard />;
  if (user.role === "pharmacist") return <PharmacistDashboard />;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#FAF9F6" }}>
      <div className="text-center">
        <p className="text-stone-600 text-lg font-semibold">Role: {user.role}</p>
        <p className="text-stone-400 text-sm mt-1">No dashboard configured for this role.</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user && user !== undefined ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        )}
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
