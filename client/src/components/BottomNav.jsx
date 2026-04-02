import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

const ITEMS = [
  { path: "/dashboard", icon: "🏠", label: "Home" },
  { path: "/players",   icon: "🏆", label: "Players" },
  { path: "/stats",     icon: "📊", label: "Stats" },
  { path: "/settings",  icon: "⚙️",  label: "Settings" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pendingSessionId, setPendingSessionId] = useState(null);

  useEffect(() => {
    api.get("/ratings/pending")
      .then(({ data }) => setPendingSessionId(data.pending?.sessionId || null))
      .catch(console.error);
  }, [pathname]);

  const handleNav = (path) => {
    if (pendingSessionId && path !== "/dashboard" && path !== "/settings") {
      navigate(`/rate/${pendingSessionId}`);
      return;
    }
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-card border-t border-gray-700 flex z-50">
      {ITEMS.map(item => {
        const active = pathname.startsWith(item.path);
        const blocked = !!pendingSessionId && item.path !== "/dashboard" && item.path !== "/settings";
        return (
          <button key={item.path} onClick={() => handleNav(item.path)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition ${
              active ? "text-brand-orange" : blocked ? "text-gray-600" : "text-gray-500 hover:text-gray-300"
            }`}>
            <span className="text-xl">{blocked ? "🔒" : item.icon}</span>
            <span className="text-xs font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}