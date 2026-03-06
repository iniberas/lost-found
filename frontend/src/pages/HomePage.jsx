import { LogOut } from "lucide-react";



// Auth Component
export default function HomePage({ user, handleLogout }) {
  return (
    <div>
      <h1> Home! </h1>
      <h2> {`Hi, ${user.username}!`} </h2>
      <button
        onClick={handleLogout}>
          Logout
      </button>
    </div>
  );
};