import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import useAuthStore from "./store/useAuthStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RatePlayers from "./pages/RatePlayers";
import Players from "./pages/Players";
import PlayerProfile from "./pages/PlayerProfile";
import TeamPicker from "./pages/TeamPicker";
import StatsHub from "./pages/StatsHub";
import Settings from "./pages/Settings";
import BottomNav from "./components/BottomNav";

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  const token = useAuthStore((s) => s.token);
  const { pathname } = useLocation();
  const showNav = token && pathname !== "/login";

  return (
    <>
      <div className={showNav ? "pb-20" : ""}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/rate/:sessionId" element={<PrivateRoute><RatePlayers /></PrivateRoute>} />
          <Route path="/players" element={<PrivateRoute><Players /></PrivateRoute>} />
          <Route path="/players/:id" element={<PrivateRoute><PlayerProfile /></PrivateRoute>} />
          <Route path="/teams/:sessionId" element={<PrivateRoute><TeamPicker /></PrivateRoute>} />
          <Route path="/stats" element={<PrivateRoute><StatsHub /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
    </>
  );
}