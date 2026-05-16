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
import MyReportsPage from "./pages/MyReportsPage";
import MyContactRequestsPage from "./pages/MyContactRequestsPage";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";

import AdminDashboardHomePage from "./pages/admin/HomePage";
import AdminManageUsersPage from "./pages/admin/User";
import AdminUserDetailPage from "./pages/admin/User/detail";
import AdminAuthPage from "./pages/admin/AuthPage";
import AdminManageCategoriesPage from "./pages/admin/Category";
import AdminCategoryDetailPage from "./pages/admin/Category/detail";
import AdminManageReportsPage from "./pages/admin/Report";
import AdminReportDetailPage from "./pages/admin/Report/detail";
import AdminHandoverPage from "./pages/admin/HandOverReportPage";
import AdminManageStorageLocationsPage from "./pages/admin/StorageLocation";
import AdminStorageLocationDetailPage from "./pages/admin/StorageLocation/detail";
import AdminViewAuditLogsPage from "./pages/admin/AuditLog";
import AdminAuditLogDetailPage from "./pages/admin/AuditLog/detail";
import AdminProtectedRoute from "./components/admin/ProtectedRoute";
import AdminProfilePage from "./pages/admin/ProfilePage";
import { apiFetch } from "./utils/api";

import UserLayout from "./layouts/UserLayout";


function AppContent() {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  const [contactRequestNotificationCount, setContactRequestNotificationCount] =
    useState({
      incoming_pending: 0,
      outgoing_approved: 0,
      outgoing_rejected: 0,
      outgoing_closed: 0,
    });

  const tryRefreshToken = async () => {
    const refreshToken =
      localStorage.getItem("refresh_token");

  const tryRefreshToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        handleLogout();
        return null;
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      return data.access_token;
    } catch {
      handleLogout();
      return null;
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const isAdminPage = window.location.pathname.startsWith("/admin");
    let token = localStorage.getItem("access_token");

    if (!token) {
      token = await tryRefreshToken();
    }

    if (!token) {
      setLoading(false);
      return;
    }

    if (isAdminPage) {
      await fetchAdminProfile(token);
    } else {
      await fetchProfile(token);
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
        setUser(null);
      }
    } catch (e) {
      setUser(null);
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
        setAdmin(null);
      }
    } catch (e) {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchContactRequestNotificationCount = async () => {
    try {
      const response = await apiFetch(
        `${API_URL}/api/v1/contact-requests/notification-count`,
        {
          auth: "required",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setContactRequestNotificationCount({
          incoming_pending: data.incoming_pending || 0,
          outgoing_approved: data.outgoing_approved || 0,
          outgoing_rejected: data.outgoing_rejected || 0,
          outgoing_closed: data.outgoing_closed || 0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchContactRequestNotificationCount();

    const interval = setInterval(() => {
      if (document.hidden) return;

      fetchContactRequestNotificationCount();
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setAdmin(null);
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
        element={
          <UserLayout
            user={user}
            handleLogout={handleLogout}
            contactRequestNotificationCount={contactRequestNotificationCount}
          >
            <HomePage user={user} handleLogout={handleLogout} />
          </UserLayout>
        }
      />

      <Route
        path="/report/:id"
        element={
          <UserLayout
            user={user}
            handleLogout={handleLogout}
            contactRequestNotificationCount={contactRequestNotificationCount}
          >
            <ReportDetailPage user={user} handleLogout={handleLogout} refreshContactRequestNotificationCount={fetchContactRequestNotificationCount} />
          </UserLayout>
        }
      />

      <Route
        path="/lapor-hilang"
        element={
          <ProtectedRoute user={user}>
            <UserLayout
              user={user}
              handleLogout={handleLogout}
              contactRequestNotificationCount={contactRequestNotificationCount}
            >
              <CreateReportPage user={user} handleLogout={handleLogout} />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/lapor-temuan"
        element={
          <ProtectedRoute user={user}>
            <UserLayout
              user={user}
              handleLogout={handleLogout}
              contactRequestNotificationCount={contactRequestNotificationCount}
            >
              <CreateReportPage user={user} handleLogout={handleLogout} />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/update-report/:id"
        element={
          <ProtectedRoute user={user}>
            <UserLayout
              user={user}
              handleLogout={handleLogout}
              contactRequestNotificationCount={contactRequestNotificationCount}
            >
              <UpdateReportPage user={user} handleLogout={handleLogout} />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-reports"
        element={
          <ProtectedRoute user={user}>
            <UserLayout
              user={user}
              handleLogout={handleLogout}
              contactRequestNotificationCount={contactRequestNotificationCount}
            >
              <MyReportsPage user={user} handleLogout={handleLogout} />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-requests"
        element={
          <ProtectedRoute user={user}>
            <UserLayout
              user={user}
              handleLogout={handleLogout}
              contactRequestNotificationCount={contactRequestNotificationCount}
            >
              <MyContactRequestsPage user={user} handleLogout={handleLogout} contactRequestNotificationCount={contactRequestNotificationCount} refreshContactRequestNotificationCount={fetchContactRequestNotificationCount} />
            </UserLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-profile"
        element={
          <ProtectedRoute user={user}>
            <UserLayout
              user={user}
              handleLogout={handleLogout}
              contactRequestNotificationCount={contactRequestNotificationCount}
            >
              <ProfilePage user={user} handleLogout={handleLogout} />
            </UserLayout>
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
        path="/admin/home"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminDashboardHomePage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminProtectedRoute admin={admin}>
            <Navigate to="/admin/home" replace />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminProfilePage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminManageUsersPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/users/:id"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminUserDetailPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/categories"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminManageCategoriesPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/categories/:id"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminCategoryDetailPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminManageReportsPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/reports/:id"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminReportDetailPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/handover"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminHandoverPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminViewAuditLogsPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/audit-logs/:id"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminAuditLogDetailPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/storage-locations"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminManageStorageLocationsPage user={admin} />
          </AdminProtectedRoute>
        }
      />

      <Route
        path="/admin/storage-locations/:id"
        element={
          <AdminProtectedRoute admin={admin}>
            <AdminStorageLocationDetailPage user={admin} />
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
