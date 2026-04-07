import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();
const API = "http://localhost:5001/api";

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [role, setRole]               = useState(null);
  const [requests, setRequests]       = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendance, setAttendance]   = useState({});
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(false);

  const fetchAll = useCallback(async () => {
    const [reqRes, annRes, attRes, stuRes] = await Promise.all([
      fetch(`${API}/requests`),
      fetch(`${API}/announcements`),
      fetch(`${API}/attendance`),
      fetch(`${API}/students`),
    ]);
    setRequests(await reqRes.json());
    setAnnouncements(await annRes.json());
    setAttendance(await attRes.json());
    setStudents(await stuRes.json());
  }, []);

  useEffect(() => { if (user) fetchAll(); }, [user, fetchAll]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setLoading(false); return { error: data.error }; }
      setUser(data.user);
      setRole(data.role);
      setLoading(false);
      return { success: true };
    } catch {
      setLoading(false);
      return { error: "Cannot connect to server. Make sure backend is running." };
    }
  };

  const bulkUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res  = await fetch(`${API}/students/bulk`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      await fetchAll();
      return data;
    } catch {
      return { error: "Cannot connect to server." };
    }
  };

  const addUser = async (type, formData) => {
    try {
      const res = await fetch(`${API}/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      await fetchAll();
      return { message: data.message };
    } catch {
      return { error: "Cannot connect to server." };
    }
  };

  const resetPassword = async (dbId, newPassword) => {
    try {
      const res = await fetch(`${API}/reset-password/${dbId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      return { message: data.message };
    } catch {
      return { error: "Cannot connect to server." };
    }
  };

  const register = async (formData) => {
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error };
      return { success: true, message: data.message };
    } catch {
      return { error: "Cannot connect to server. Make sure backend is running." };
    }
  };

  const logout = () => { setUser(null); setRole(null); setRequests([]); setAnnouncements([]); setAttendance({}); setStudents([]); };

  const submitRequest = async (req) => {
    await fetch(`${API}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    await fetchAll();
  };

  const updateRequest = async (id, updates) => {
    await fetch(`${API}/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await fetchAll();
  };

  const addAnnouncement = async (ann) => {
    await fetch(`${API}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ann),
    });
    await fetchAll();
  };

  const markAttendance = async (studentDbId, present) => {
    await fetch(`${API}/attendance/${studentDbId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ present }),
    });
    await fetchAll();
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, addUser, bulkUpload, resetPassword, loading, requests, submitRequest, updateRequest, announcements, addAnnouncement, attendance, markAttendance, students }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
