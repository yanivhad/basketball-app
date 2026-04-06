import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const TABS = ["🏆 Rankings", "📅 Attendance", "🗓️ Sessions"];
const CATS = ["athleticism","shooting","passing","defense","basketballIq","hustle","vibe"];
const CAT_LABELS = {
  athleticism: "Athletic", shooting: "Shooting", passing: "Passing",
  defense: "Defense", basketballIq: "IQ", hustle: "Hustle", vibe: "Vibe"
};

export default function StatsHub() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/users"), api.get("/sessions")])
      .then(([{ data: u }, { data: s }]) => {
        setPlayers(u);
        setSessions(s);
        if (u.length) setSelectedPlayer(u[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center text-gray-400">
      Loading stats...
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">← Back</button>
        <span className="font-bold">Stats Hub 📊</span>
        <span />
      </nav>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 px-4 bg-brand-card">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`px-4 py-3 text-sm font-bold transition border-b-2 ${
              tab === i ? "border-brand-orange text-white" : "border-transparent text-gray-400 hover:text-white"
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {tab === 0 && <RankingsTab players={players} selectedPlayer={selectedPlayer} setSelectedPlayer={setSelectedPlayer} navigate={navigate} />}
        {tab === 1 && <AttendanceTab players={players} sessions={sessions} navigate={navigate} />}
        {tab === 2 && <SessionsTab sessions={sessions} />}
      </div>
    </div>
  );
}

/* ── Rankings Tab ── */
function RankingsTab({ players, selectedPlayer, setSelectedPlayer, navigate }) {
    const [showNames, setShowNames] = useState(false);  // ← add this
  const sorted = [...players].sort((a, b) =>
    parseFloat(b.averages?.overall || 0) - parseFloat(a.averages?.overall || 0)
  );
  const player = players.find(p => p.id === selectedPlayer);
  const radarData = player?.averages
    ? CATS.map(k => ({ cat: CAT_LABELS[k], value: parseFloat(player.averages[k] || 0) }))
    : [];

  return (
    <div className="space-y-6">
      {/* Leaderboard */}
      <div className="bg-brand-card rounded-2xl p-5">
<div className="flex items-center justify-between mb-4">
  <h2 className="font-bold text-lg">Overall Leaderboard 🏆</h2>
  <button onClick={() => setShowNames(s => !s)}
    className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 transition">
    {showNames ? "🙈 Hide Names" : "👁 Show Names"}
  </button>
</div>
        <div className="space-y-2">
          {sorted.map((p, i) => (
         <div key={p.id}
  onClick={() => showNames && setSelectedPlayer(p.id)}
  className={`flex items-center gap-3 p-3 rounded-xl transition ${
    showNames ? "cursor-pointer" : "cursor-default"
  } ${selectedPlayer === p.id && showNames ? "bg-brand-orange/20 border border-brand-orange/40" : "hover:bg-gray-700/40"}`}>
  ...
  <span className="flex-1 font-bold text-sm">
    {showNames ? (
      <>
        {p.shirtNumber ? <span className="text-brand-orange">#{p.shirtNumber} </span> : ""}
        {p.name}
      </>
    ) : (
      <span className="text-gray-400 italic">Player {i + 1}</span>
    )}
  </span>
              <div className="flex gap-3 text-xs text-gray-400">
                <span>{p.attendanceCount} games</span>
              </div>
              <span className={`font-bold text-lg ml-2 ${
                p.averages?.overall >= 8 ? "text-green-400" :
                p.averages?.overall >= 5 ? "text-yellow-400" : "text-gray-400"
              }`}>{p.averages?.overall ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Radar chart for selected player */}
      {showNames && player && radarData.length > 0 && (
        <div className="bg-brand-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              {player.shirtNumber ? `#${player.shirtNumber} ` : ""}{player.name}'s Radar 🎯
            </h2>
            <button onClick={() => navigate(`/players/${player.id}`)}
              className="text-brand-orange text-xs hover:underline">View profile →</button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="cat" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <Radar dataKey="value" stroke="#F97316" fill="#F97316" fillOpacity={0.25} dot />
            </RadarChart>
          </ResponsiveContainer>
          {/* Category bars */}
          <div className="mt-4 space-y-2">
            {CATS.map(k => {
              const val = parseFloat(player.averages?.[k] || 0);
              const color = val >= 8 ? "bg-green-500" : val >= 5 ? "bg-yellow-500" : "bg-red-500";
              return (
                <div key={k} className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs w-20">{CAT_LABELS[k]}</span>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${val * 10}%` }} />
                  </div>
                  <span className="text-white text-xs font-bold w-6 text-right">{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Attendance Tab ── */
function AttendanceTab({ players, sessions, navigate }) {
  const totalSessions = sessions.length;
  const sorted = [...players].sort((a, b) => b.attendanceCount - a.attendanceCount);

  const barData = sorted.map(p => ({
    name: p.name.split(" ")[0],
    games: p.attendanceCount,
    rate: totalSessions ? Math.round((p.attendanceCount / totalSessions) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="bg-brand-card rounded-2xl p-5">
        <h2 className="font-bold text-lg mb-4">Games Played 🎯</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#2A2A3E", border: "none", borderRadius: 8 }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#F97316" }}
            />
            <Bar dataKey="games" radius={[6,6,0,0]}>
              {barData.map((_, i) => (
                <Cell key={i} fill={i === 0 ? "#F97316" : "#4B5563"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Attendance list */}
      <div className="bg-brand-card rounded-2xl p-5">
        <h2 className="font-bold text-lg mb-4">Attendance Rate 📋</h2>
        <div className="space-y-3">
          {sorted.map((p, i) => {
            const rate = totalSessions ? Math.round((p.attendanceCount / totalSessions) * 100) : 0;
            const color = rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500";
            return (
              <div key={p.id} onClick={() => navigate(`/players/${p.id}`)}
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition">
                <span className="text-gray-500 text-sm w-5">{i+1}</span>
                <span className="text-white text-sm font-bold w-28 truncate">
                  {p.shirtNumber ? <span className="text-brand-orange">#{p.shirtNumber} </span> : ""}{p.name}
                </span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${rate}%` }} />
                </div>
                <span className="text-white text-xs font-bold w-16 text-right">
                  {p.attendanceCount}/{totalSessions} ({rate}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Sessions Tab ── */
function SessionsTab({ sessions }) {
  const completed = sessions.filter(s => s.status === "completed");
  const upcoming  = sessions.filter(s => s.status === "upcoming");

  const sessionData = completed.slice(0, 8).reverse().map(s => ({
    date: new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    players: s.attendance?.filter(a => a.confirmed).length || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Sessions", value: sessions.length, emoji: "🗓️" },
          { label: "Completed",      value: completed.length, emoji: "✅" },
          { label: "Upcoming",       value: upcoming.length,  emoji: "⏳" },
        ].map(c => (
          <div key={c.label} className="bg-brand-card rounded-2xl p-4 text-center">
            <p className="text-2xl">{c.emoji}</p>
            <p className="text-2xl font-bold text-white mt-1">{c.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Players per session chart */}
      {sessionData.length > 0 && (
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-4">Players Per Session 👥</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sessionData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#2A2A3E", border: "none", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#60A5FA" }}
              />
              <Bar dataKey="players" fill="#3B82F6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session history */}
      <div className="bg-brand-card rounded-2xl p-5">
        <h2 className="font-bold text-lg mb-4">Session History 📜</h2>
        {sessions.length === 0 ? (
          <p className="text-gray-400 text-sm">No sessions yet</p>
        ) : (
          <div className="space-y-2">
            {sessions.map(s => {
              const count = s.attendance?.filter(a => a.confirmed).length || 0;
              return (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <p className="text-white text-sm font-bold">
                      {new Date(s.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    {s.location && <p className="text-gray-500 text-xs">📍 {s.location}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      s.status === "upcoming" ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"
                    }`}>{s.status}</span>
                    <p className="text-gray-400 text-xs mt-1">{count} players</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}