import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Agenda from "./pages/Agenda.jsx";
import Horarios from "./pages/Horarios.jsx";
import Login from "./pages/Login.jsx";
import Servicos from "./pages/Servicos.jsx";
import { getToken } from "./api.js";

function ProtectedLayout({ children }) {
  const location = useLocation();
  const token = getToken();
  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return (
    <div className="min-h-screen p-6 lg:p-10 grid gap-8 lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <main className="flex flex-col gap-8">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/agenda"
        element={
          <ProtectedLayout>
            <Agenda />
          </ProtectedLayout>
        }
      />
      <Route
        path="/horarios"
        element={
          <ProtectedLayout>
            <Horarios />
          </ProtectedLayout>
        }
      />
      <Route
        path="/servicos"
        element={
          <ProtectedLayout>
            <Servicos />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
