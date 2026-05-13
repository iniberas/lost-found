import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// pages
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import CreateReportPage from "./pages/CreateReportPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import UpdateReportPage from "./pages/UpdateReportPage";
import MyReportsPage from './pages/MyReportsPage';
import MyContactRequestsPage from './pages/MyContactRequestsPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboardHomePage from "./pages/admin/HomePage";
import AdminManageUsersPage from "./pages/admin/ManageUsersPage";
import AdminUserDetailPage from "./pages/admin/UserDetailPage";
import AdminAuthPage from "./pages/admin/AuthPage";
import AdminManageCategoriesPage from "./pages/admin/ManageCategoriesPage";
import AdminManageReportsPage from "./pages/admin/ManageReportsPage";
import AdminReportDetailPage from "./pages/admin/ReportDetailPage";
import AdminHandoverPage from "./pages/admin/HandOverReportPage";
import AdminManageStorageLocationsPage from "./pages/admin/ManageStorageLocationPage";
import AdminViewAuditLogsPage from "./pages/admin/ViewAuditLogsPage";
import AdminProtectedRoute from "./components/admin/ProtectedRoute";

function AppContent() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const tryRefreshToken = async () => {
    const refreshToken =
      localStorage.getItem("refresh_token");

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/v1/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        }
      );

      if (!response.ok) {
        handleLogout();
        return null;
      }

      const data = await response.json();

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      return data.access_token;

    } catch {
      handleLogout();
      return null;
    }
  };

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const isAdminPage =
      window.location.pathname.startsWith("/admin");

    let token =
      localStorage.getItem("access_token");

    // ga ada access token
    if (!token) {
      token = await tryRefreshToken();
    }

    // masih ga ada
    if (!token) {
      setLoading(false);
      return;
    }

    if (isAdminPage) {
      fetchAdminProfile(token);
    } else {
      fetchProfile(token);
    }
  };


  const fetchProfile = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setUser(await response.json());
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminProfile = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/admin/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setAdmin(await response.json());
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-poppins text-gray-500">
        Loading Waldo...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          !user ? (
            <AuthPage
              onLoginSuccess={() =>
                fetchProfile(localStorage.getItem("access_token"))
              }
            />
          ) : (
            <Navigate to="/home" replace />
          )
        }
      />

      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route
        path="/home"
        element={<HomePage user={user} handleLogout={handleLogout} />}
      />

      <Route
        path="/report/:id"
        element={<ReportDetailPage user={user} handleLogout={handleLogout} />}
      />

      <Route
        path="/lapor-hilang"
        element={
          <ProtectedRoute user={user}>
            <CreateReportPage user={user} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lapor-temuan"
        element={
          <ProtectedRoute user={user}>
            <CreateReportPage user={user} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/update-report/:id"
        element={
          <ProtectedRoute user={user}>
            <UpdateReportPage user={user} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-reports"
        element={
          <ProtectedRoute user={user}>
            <MyReportsPage user={user} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-requests"
        element={
          <ProtectedRoute user={user}>
            <MyContactRequestsPage user={user} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-profile"
        element={
          <ProtectedRoute user={user}>
            <ProfilePage user={user} handleLogout={handleLogout} />
          </ProtectedRoute>
        }
      />


      <Route
        path="/admin/auth"
        element={
          !admin ? (
            <AdminAuthPage
              onLoginSuccess={() =>
                fetchAdminProfile(localStorage.getItem("access_token"))
              }
            />
          ) : (
            <Navigate to="/admin/home" replace />
          )
        }
      />

      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <Navigate to="/admin/home" replace />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/home"
        element={
          <AdminProtectedRoute>
            <AdminDashboardHomePage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminProtectedRoute>
            <AdminManageUsersPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:id"
        element={
          <AdminProtectedRoute>
            <AdminUserDetailPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/categories"
        element={
          <AdminProtectedRoute>
            <AdminManageCategoriesPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <AdminProtectedRoute>
            <AdminManageReportsPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/reports/:id"
        element={
          <AdminProtectedRoute>
            <AdminReportDetailPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/handover"
        element={
          <AdminProtectedRoute>
            <AdminHandoverPage user={admin} />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <AdminProtectedRoute>
            <AdminViewAuditLogsPage user={admin} />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="/admin/storage-locations"
        element={
          <AdminProtectedRoute>
            <AdminManageStorageLocationsPage user={admin} />
          </AdminProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
