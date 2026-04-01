import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";

export default function Players() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/users")
      .then(({ data }) => setPlayers(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...players].sort((a, b) =>
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
        <h1 className="text-2xl font-bold mb-6">Leaderboard 🏆</h1>

        {loading ? (
          <p className="text-gray-400 text-center mt-16">Loading players...</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((p, i) => (
              <div key={p.id}
                onClick={() => navigate(`/players/${p.id}`)}
                className="bg-brand-card rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-opacity-80 transition"
              >
                {/* Rank */}
                <span className="text-2xl font-bold text-gray-500 w-8 text-center">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-bold text-white">
                    {p.shirtNumber ? <span className="text-brand-orange">#{p.shirtNumber} </span> : ""}
                    {p.name}
                    {p.id === user?.id && <span className="text-xs text-gray-400 ml-2">(you)</span>}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {p.attendanceCount} games · {p.totalRatings} ratings
                  </p>
                </div>

                {/* Overall score */}
                <div className="text-right">
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