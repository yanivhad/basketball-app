import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchPlayers = () => {
    api.get("/users")
      .then(({ data }) => { setAllPlayers(data); setPlayers(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlayers(); }, []);

  const visible = allPlayers.filter(p =>
    showInactive ? p.status === "inactive" : p.status === "active"
  );

  const sorted = [...visible].sort((a, b) =>
    (b.averages?.overall || 0) - (a.averages?.overall || 0)
  );

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">← Back</button>
        <span className="font-bold">Players 🏀</span>
        <span />
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header + toggle */}
       <div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold">
    {showInactive ? "Inactive Players 💤" : "Leaderboard 🏆"}
  </h1>
  <div className="flex items-center gap-2">
    {user?.role === "admin" && (
      <button onClick={() => setShowInactive(s => !s)}
        className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition">
        {showInactive ? "Show Active" : "Show Inactive"}
      </button>
    )}
  </div>
</div>

        {loading ? (
          <p className="text-gray-400 text-center mt-16">Loading players...</p>
        ) : sorted.length === 0 ? (
          <p className="text-gray-400 text-center mt-16">
            {showInactive ? "No inactive players 🎉" : "No players yet 👀"}
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((p, i) => (
            <div key={p.id}
  onClick={() => navigate(`/players/${p.id}`)}
  className="bg-brand-card rounded-2xl p-4 flex items-center gap-4 transition cursor-pointer hover:bg-opacity-80"
>
                {/* Rank */}
                <span className="text-2xl font-bold text-gray-500 w-8 text-center">
                  {!showInactive
                    ? i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`
                    : "💤"}
                </span>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-bold text-white">
                    {p.shirtNumber ? <span className="text-brand-orange">#{p.shirtNumber} </span> : ""}
                    {p.name}
                    {p.id === user?.id && <span className="text-xs text-gray-400 ml-2">(you)</span>}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{p.totalRatings} ratings</p>
                </div>

                {/* Attendance count */}
                <div className="text-center w-12">
                  <p className="text-lg font-bold text-blue-400">{p.attendanceCount}</p>
                  <p className="text-gray-500 text-xs">games</p>
                </div>

                {/* Overall score */}
                <div className="text-right w-12">
                  <p className={`text-2xl font-bold ${
                    p.averages?.overall >= 8 ? "text-green-400" :
                    p.averages?.overall >= 5 ? "text-yellow-400" : "text-gray-400"
                  }`}>
                    {p.averages?.overall ?? "—"}
                  </p>
                  <p className="text-gray-500 text-xs">overall</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}