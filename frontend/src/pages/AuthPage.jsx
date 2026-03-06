import { useEffect, useState } from "react";
import { Mail, Lock, User } from "lucide-react";


const API_URL = "http://127.0.0.1:8000"; 

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


// Auth Component
export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // client side check
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // password count check or register
    if (!isLogin) {
      if (formData.password.length < 6) {
        setError("Password should have at least 6 characters")
        return;
      }
    }

    setLoading(true);
    const endpoint = isLogin ? "/login" : "/register";

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          throw new Error(data.detail[0].msg)
        }
        throw new Error(data.detail || "An uxpected error occurred.")
      }
      if (isLogin) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        onLoginSuccess();
      } else {
        setIsLogin(true);
        setError("Success! Login now.");
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div>
        <h1>Lost and Found</h1>
        <h2>{isLogin ? "Login" : "Register"}</h2>
      </div>
      <div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          {!isLogin && <Input icon={User} placeholder="Username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required />}
          <Input icon={Mail} type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          <Input icon={Lock} type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          <Button type="submit" isLoading={loading}>{isLogin ? "Login" : "Sign Up"}</Button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)}>{isLogin ? "Register here.." : "Login here.."}</button>
      </div>
    </div>
  );
};