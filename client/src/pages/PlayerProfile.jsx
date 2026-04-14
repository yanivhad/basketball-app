import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";

const CATEGORIES = [
  { key: "athleticism",  label: "🏃 Athleticism" },
  { key: "shooting",     label: "🎯 Shooting" },
  { key: "passing",      label: "🤝 Passing" },
  { key: "defense",      label: "🛡️ Defense" },
  { key: "basketballIq", label: "🧠 Basketball IQ" },
  { key: "hustle",       label: "🔥 Hustle" },
  { key: "vibe",         label: "😎 Vibe" },
];

export default function PlayerProfile() {
  const { id } = useParams();
  const { user: me } = useAuthStore();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/users/${id}`)
      .then(({ data }) => setPlayer(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleStatus = async () => {
    const newStatus = player.status === "active" ? "inactive" : "active";
    await api.patch(`/users/${id}/status`, { status: newStatus });
    setPlayer(p => ({ ...p, status: newStatus }));
  };

  if (loading) return <Screen><p className="text-gray-400">Loading...</p></Screen>;
  if (!player) return <Screen><p className="text-gray-400">Player not found</p></Screen>;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition">← Back</button>
        <span className="font-bold">Player Profile</span>
        <span />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* Header */}
        <div className="bg-brand-card rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">🏀</div>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-2xl font-bold">
              {player.shirtNumber && <span className="text-brand-orange">#{player.shirtNumber} </span>}
              {player.name}
            </h1>
            {me?.role === "admin" && me.id !== player.id && (
              <button onClick={handleToggleStatus}
                className={`text-xs font-bold px-3 py-1 rounded-full transition shrink-0 ${
                  player.status === "active"
                    ? "bg-red-900 text-red-300 hover:bg-red-800"
                    : "bg-green-900 text-green-300 hover:bg-green-800"
                }`}>
                {player.status === "active" ? "Deactivate" : "Activate"}
              </button>
            )}
          </div>
          <p className="text-gray-400 text-sm mt-1">@{player.username}</p>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-orange">{player.averages?.overall ?? "—"}</p>
              <p className="text-gray-400 text-xs">Overall</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{player.actuallyPlayedCount ?? 0}</p>
              <p className="text-gray-400 text-xs">Showed Up</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{player.attendanceCount ?? 0}</p>
              <p className="text-gray-400 text-xs">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{player.noShowCount ?? 0}</p>
              <p className="text-gray-400 text-xs">No Shows 👻</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{player.surpriseShowCount ?? 0}</p>
              <p className="text-gray-400 text-xs">Surprise Shows 🎉</p>
            </div>
          </div>
        </div>

        {/* Ratings breakdown */}
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-4">Ratings Breakdown ⭐</h2>
          {player.averages ? (
            <div className="space-y-3">
              {CATEGORIES.map(c => {
                const val = parseFloat(player.averages[c.key]);
                const pct = (val / 10) * 100;
                const color = val >= 8 ? "bg-green-500" : val >= 5 ? "bg-yellow-500" : "bg-red-500";
                return (
                  <div key={c.key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{c.label}</span>
                      <span className="font-bold text-white">{val}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No ratings yet 👀</p>
          )}
        </div>

        {/* Feedback */}
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-4">Feedback 💬</h2>
          {player.feedback?.length === 0 ? (
            <p className="text-gray-400 text-sm">No feedback yet</p>
          ) : (
            <div className="space-y-3">
              {player.feedback.map(f => (
                <div key={f.id} className="bg-brand-dark rounded-xl p-3">
                  <p className="text-white text-sm">{f.message}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    — {f.fromUser.name} · {new Date(f.session.date).toLocaleDateString("en-GB")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Screen({ children }) {
  return <div className="min-h-screen bg-brand-dark flex items-center justify-center">{children}</div>;
}