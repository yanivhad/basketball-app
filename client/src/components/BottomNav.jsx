import { useNavigate, useLocation } from "react-router-dom";

const ITEMS = [
  { path: "/dashboard", icon: "🏠", label: "Home" },
  { path: "/players",   icon: "🏆", label: "Players" },
  { path: "/stats",     icon: "📊", label: "Stats" },
  { path: "/settings",  icon: "⚙️",  label: "Settings" },
];

export default function BottomNav() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-card border-t border-gray-700 flex z-50 safe-bottom">
      {ITEMS.map(item => {
        const active = pathname.startsWith(item.path);
        return (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition ${
              active ? "text-brand-orange" : "text-gray-500 hover:text-gray-300"
            }`}>
            <span className="text-xl">{item.icon}</span>
            <span className={`text-xs font-bold ${active ? "text-brand-orange" : "text-gray-500"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}