import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";

const TEAM_COLORS = [
  { light: "bg-orange-900/40", text: "text-orange-300", label: "Team 1 🟠" },
  { light: "bg-blue-900/40",   text: "text-blue-300",   label: "Team 2 🔵" },
  { light: "bg-green-900/40",  text: "text-green-300",  label: "Team 3 🟢" },
  { light: "bg-purple-900/40", text: "text-purple-300", label: "Team 4 🟣" },
];

// Returns a canonical string key for a set of teams (order-independent)
function teamsKey(teams) {
  return teams
    .map(t => t.map(p => p.id).sort().join(","))
    .sort()
    .join("|");
}

// Variance of team average scores — lower = more balanced
function teamsVariance(teams) {
  const avgs = teams.map(t => t.reduce((s, p) => s + p._score, 0) / t.length);
  const mean = avgs.reduce((s, v) => s + v, 0) / avgs.length;
  return avgs.reduce((s, v) => s + (v - mean) ** 2, 0);
}

// Fisher-Yates shuffle in place
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function balanceTeams(players, playersPerTeam, prevKey = null) {
  const numTeams = Math.floor(players.length / playersPerTeam);
  if (numTeams < 2) return { teams: [players], bench: [] };

  const teamPlayers = players.slice(0, numTeams * playersPerTeam);
  const bench = players.slice(numTeams * playersPerTeam);

  // Score by skill rating only (what users can see and relate to)
  const scored = teamPlayers.map(p => ({
    ...p,
    _score: parseFloat(p.averages?.overall) || 5,
  })).sort((a, b) => b._score - a._score);

  // Each attempt: shuffle within skill tiers so balance is preserved
  // but team composition differs each time
  function attempt() {
    const out = [];
    for (let t = 0; t < Math.ceil(scored.length / numTeams); t++) {
      const tier = scored.slice(t * numTeams, (t + 1) * numTeams).slice();
      shuffle(tier);
      out.push(...tier);
    }
    const teams = Array.from({ length: numTeams }, () => []);
    out.forEach((p, i) => teams[i % numTeams].push(p));
    return teams;
  }

  // Run 300 attempts, keep the most balanced arrangement that differs from prev
  let best = null;
  let bestVar = Infinity;

  for (let i = 0; i < 300; i++) {
    const candidate = attempt();
    const key = teamsKey(candidate);
    const v = teamsVariance(candidate);
    if (key !== prevKey && v < bestVar) {
      bestVar = v;
      best = candidate;
    }
  }

  return { teams: best || attempt(), bench };
}

function teamAvg(team) {
  if (!team.length) return "—";
  var scores = team.map(function(p) {
    return parseFloat(p.averages ? p.averages.overall : 0) || 0;
  });
  var sum = scores.reduce(function(s, v) { return s + v; }, 0);
  return (sum / scores.length).toFixed(1);
}

export default function TeamPicker() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const [allPlayers, setAllPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [teams, setTeams] = useState(null);
  const [bench, setBench] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const prevKeyRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const sessRes = await api.get("/sessions");
        const session = sessRes.data.find(function(s) {
          return s.id === parseInt(sessionId);
        });
        const confirmed = session && session.attendance
          ? session.attendance.filter(function(a) { return a.confirmed; }).map(function(a) { return a.user; })
          : [];
        const usersRes = await api.get("/users");
        const withStats = confirmed.map(function(c) {
          return usersRes.data.find(function(u) { return u.id === c.id; }) || c;
        });
        setAllPlayers(withStats);
        setSelected(withStats.map(function(p) { return p.id; }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [sessionId]);

  function togglePlayer(id) {
    setSelected(function(s) {
      return s.includes(id) ? s.filter(function(x) { return x !== id; }) : [...s, id];
    });
    prevKeyRef.current = null;
    setTeams(null);
    setSaved(false);
  }

  function generate() {
    const playing = allPlayers.filter(function(p) { return selected.includes(p.id); });
    const result = balanceTeams(playing, playersPerTeam, prevKeyRef.current);
    prevKeyRef.current = teamsKey(result.teams);
    setTeams(result.teams);
    setBench(result.bench);
    setSaved(false);
  }

  async function handleSave() {
    if (!teams) return;
    setSaving(true);
    try {
      await api.post("/teams/session/" + sessionId, {
        teams: teams.map(function(t, i) {
          return { teamNumber: i + 1, playerIds: t.map(function(p) { return p.id; }) };
        }),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleShare() {
    if (!teams) return;
    const teamsText = teams.map(function(t, i) {
      const color = TEAM_COLORS[i] || { label: "Team " + (i + 1) };
      const players = t.map(function(p) {
        return "• " + (p.shirtNumber ? "#" + p.shirtNumber + " " : "") + p.name;
      }).join("\n");
      return color.label + ":\n" + players;
    }).join("\n\n");
    const benchText = bench.length
      ? "\n\n🪑 Bench:\n" + bench.map(function(p) { return "• " + p.name; }).join("\n")
      : "";
    window.open("https://wa.me/?text=" + encodeURIComponent("🏀 Tonight's Teams!\n\n" + teamsText + benchText), "_blank");
  }

  const numTeams = Math.floor(selected.length / playersPerTeam);
  const remainder = selected.length % playersPerTeam;

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <p className="text-gray-400">Loading players...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">
          Back
        </button>
        <span className="font-bold">Team Picker</span>
        <span />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-1">Who is playing tonight?</h2>
          <p className="text-gray-400 text-sm mb-1">All confirmed attendees are pre-selected.</p>
          <p className="text-gray-500 text-xs mb-4">Uncheck players to exclude from teams — this won't affect their event attendance.</p>
          <div className="flex flex-wrap gap-2">
            {allPlayers.map(function(p) {
              const on = selected.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePlayer(p.id)}
                  className={"px-3 py-1.5 rounded-full text-sm font-bold transition " + (on ? "bg-brand-orange text-white" : "bg-gray-700 text-gray-400")}>
                  {p.shirtNumber ? "#" + p.shirtNumber + " " : ""}{p.name}
                </button>
              );
            })}
          </div>
          <p className="text-gray-500 text-xs mt-3">{selected.length} players selected</p>
        </div>

        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-1">Players per team</h2>
          <p className="text-gray-400 text-sm mb-4">
            {selected.length} players — {numTeams} team{numTeams !== 1 ? "s" : ""} of {playersPerTeam}
            {remainder > 0 ? " + " + remainder + " on bench" : ""}
          </p>
          <div className="flex gap-2">
            {[3, 4, 5].map(function(n) {
              return (
                <button key={n} onClick={() => { setPlayersPerTeam(n); prevKeyRef.current = null; setTeams(null); setSaved(false); }}
                  className={"flex-1 py-2 rounded-xl text-sm font-bold transition " + (playersPerTeam === n ? "bg-brand-orange text-white" : "bg-gray-700 text-gray-400 hover:text-white")}>
                  {n}v{n}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={generate}
          disabled={selected.length < playersPerTeam * 2}
          className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-lg">
          {teams ? "🔀 Shuffle Again" : "Make Teams!"}
        </button>

        {teams && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {teams.map(function(team, i) {
                const c = TEAM_COLORS[i] || { light: "bg-gray-800", text: "text-gray-300", label: "Team " + (i + 1) };
                return (
                  <div key={i} className={"rounded-2xl p-4 " + c.light}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={"font-bold text-sm " + c.text}>{c.label}</h3>
                      <span className={"text-xs font-bold " + c.text}>avg {teamAvg(team)}</span>
                    </div>
                    <div className="space-y-2">
                      {team.map(function(p) {
                        return (
                          <div key={p.id}>
                            <span className="text-white text-sm">
                              {p.shirtNumber ? <span className="text-gray-400">{"#" + p.shirtNumber + " "}</span> : ""}
                              {p.name}
                            </span>
                            <p className="text-gray-500 text-xs">
                              {p.weight ? p.weight + "kg" : ""}{p.weight && p.height ? " · " : ""}{p.height ? p.height + "cm" : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {bench.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-gray-400 mb-2">Bench ({bench.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {bench.map(function(p) {
                    return (
                      <span key={p.id} className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                        {p.shirtNumber ? "#" + p.shirtNumber + " " : ""}{p.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {isAdmin && (
                <button onClick={handleSave} disabled={saving || saved}
                  className={"flex-1 font-bold py-3 rounded-xl transition " + (saved ? "bg-green-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white")}>
                  {saved ? "Saved!" : saving ? "Saving..." : "Save Teams"}
                </button>
              )}
              <button onClick={handleShare}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
                Share on WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}