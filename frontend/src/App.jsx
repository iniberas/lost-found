import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// pages
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import CreateReportPage from './pages/CreateReportPage';

function AppContent() {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://127.0.0.1:8000'; 

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) fetchProfile(token);
    else setLoading(false);
  }, []);

  const fetchProfile = async (token) => {
    try {
      const response = await fetch(`${API_URL}/user/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-poppins text-gray-500">
        Loading IPB Lost & Found...
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={!user ? <AuthPage onLoginSuccess={() => fetchProfile(localStorage.getItem('access_token'))} /> : <Navigate to="/home" replace />} 
      />

      <Route path="/" element={<Navigate to="/home" replace />} />

      <Route 
        path="/home" 
        element={<HomePage user={user} handleLogout={handleLogout} />} 
      />

      <Route 
        path="/lapor-hilang" 
        element={<CreateReportPage user={user} handleLogout={handleLogout} />} 
      />
      <Route 
        path="/lapor-temuan" 
        element={<CreateReportPage user={user} handleLogout={handleLogout} />} 
      />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}