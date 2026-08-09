import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getUser, getActiveGroup, type StoredUser, type ActiveGroup } from "./lib/store";
import { AuthPage } from "./pages/AuthPage";
import { GroupSelectPage } from "./pages/GroupSelectPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { MemberDashboard } from "./pages/MemberDashboard";

export function App() {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [group, setGroupState] = useState<ActiveGroup | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setUserState(getUser());
    setGroupState(getActiveGroup());
  };

  useEffect(() => {
    refresh();
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/auth" replace />
          ) : !group ? (
            <Navigate to="/groups" replace />
          ) : group.role === "admin" ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/member" replace />
          )
        }
      />
      <Route path="/auth" element={<AuthPage onAuth={refresh} />} />
      <Route path="/groups" element={user ? <GroupSelectPage user={user} onSelect={refresh} onLogout={refresh} /> : <Navigate to="/auth" replace />} />
      <Route
        path="/admin"
        element={user && group?.role === "admin" ? <AdminDashboard user={user} group={group} onBack={refresh} /> : <Navigate to="/" replace />}
      />
      <Route
        path="/member"
        element={user && group?.role === "member" ? <MemberDashboard user={user} group={group} onBack={refresh} /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}
