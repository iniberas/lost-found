import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';

// pages
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

const Input = ({ icon: Icon, ...props }) => (
  <div>
    <div>
      <Icon size={18} />
    </div>
    <input
      {...props}
    />
  </div>
);


const Button = ({ children, isLoading, ...props }) => {
  return (
    <button disabled={isLoading} {...props}>
      {isLoading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : children}
    </button>
  );
};



function AppContent() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://127.0.0.1:8000'; 

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) fetchProfile(token);
    else setLoading(false);
  }, []);

  const fetchProfile = async (token) => {
    try {
      const response = await fetch(`${API_URL}/user/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {setUser(await response.json())}
      else handleLogout();
    } catch (e) { handleLogout(); }
    finally { setLoading(false); }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }


  return (
    <Routes>
      <Route path="/auth" element={!user ? <AuthPage onLoginSuccess={() => { fetchProfile(localStorage.getItem('access_token')) }}/> : <Navigate to="/home" /> }/>

      {/* root redirect ke auth atau home  */}
      <Route path="/" element={user ? <Navigate to="/home" replace /> : <Navigate to="/auth" />} />

      <Route path="/home" element={user ? <HomePage user={user} handleLogout={handleLogout} /> : <Navigate to="/auth" />} />
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