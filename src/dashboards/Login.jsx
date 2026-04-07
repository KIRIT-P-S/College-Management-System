import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../portal.css";

export default function Login() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(username, password);
    if (result?.error) setError(result.error);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>🏫 College Portal</h1>
          <p>Enter your credentials to continue</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="error">⚠️ {error}</p>}
          <button type="submit" className="login-btn" disabled={loading} style={{ background: "#4f46e5" }}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
