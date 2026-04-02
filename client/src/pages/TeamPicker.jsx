import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const TEAM_COLORS = [
  { light: "bg-orange-900/40", text: "text-orange-300", label: "Team 1 🟠" },
  { light: "bg-blue-900/40",   text: "text-blue-300",   label: "Team 2 🔵" },
  { light: "bg-green-900/40",  text: "text-green-300",  label: "Team 3 🟢" },
  { light: "bg-purple-900/40", text: "text-purple-300", label: "Team 4 🟣" },
];

function balanceTeams(players, playersPerTeam) {
  const numTeams = Math.floor(players.length / playersPerTeam);
  if (numTeams < 2) return { teams: [players], bench: [] };

  const teamPlayers = players.slice(0, numTeams * playersPerTeam);
  const bench = players.slice(numTeams * playersPerTeam);

  // Score = skill + physical
  const withScore = teamPlayers.map(p => {
    const skill = parseFloat(p.averages?.overall || 5);
    const weight = parseFloat(p.weight || 75);
    const height = parseFloat(p.height || 175);
    const physicalScore = ((weight - 50) / 70 + (height - 160) / 50) * 2.5;
    return { ...p, _score: skill + physicalScore };
  });

  // Sort descending and snake-draft into numTeams teams
  const sorted = withScore.sort((a, b) => b._score - a._score);
  const teams = Array.from({ length: numTeams }, () => []);
  sorted.forEach((p, i) => {
    const round = Math.floor(i / numTeams);
    const pos = i % numTeams;
    const slot = round % 2 === 0 ? pos : numTeams - 1 - pos;
    teams[slot].push(p);
  });

  return { teams, bench };
}

function teamAvg(team) {
  if (!team.length) return "—";
  const scores = team.map(p => parseFloat(p.averages?.overall || 0));
  return (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
}

export default function TeamPicker() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [allPlayers, setAllPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [teams, setTeams] = useState(null);
  const [bench, setBench] = useState([]);
  const [shuffles, setShuffles] = useState(0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const MAX_SHUFFLES = 3;

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: sessions } = await api.get("/sessions");
        const session = sessions.find(s => s.id === parseInt(sessionId));
        const confirmed = session?.attendance.filter(a => a.confirmed).map(a => a.user) || [];
        const { data: users } = await api.get("/users");
        const withStats = confirmed.map(c => users.find(u => u.id === c.id) || c);
        setAllPlayers(withStats);
        setSelected(withStats.map(p => p.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  const togglePlayer = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setTeams(null);
    setSaved(false);
  };

  const generate = () => {
    const playing = allPlayers.filter(p => selected.includes(p.id));
    const { teams: t, bench: b } = balanceTeams(playing, playersPerTeam);
    setTeams(t);
    setBench(b);
    setShuffles(s => s + 1);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!teams) return;
    setSaving(true);
    try {
      await api.post(`/teams/session/${sessionId}`, {
        teams: teams.map((t, i) => ({ teamNumber: i + 1, playerIds: t.map(p => p.id) })),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (!teams) return;
    const teamsText = teams.map((t, i) =>
      `${TEAM_COLORS[i]?.label || `Team ${i+1}`}:\n${t.map(p => `• ${p.shirtNumber ? `#${p.shirtNumber} ` : ""}${p.name}`).join("\n")}`
    ).join("\n\n");
    const benchText = bench.length
      ? `\n\n🪑 Bench:\n${bench.map(p => `• ${p.name}`).join("\n")}`
      : "";
    window.open(`https://wa.me/?text=${encodeURIComponent(`🏀 Tonight's Teams!\n\n${teamsText}${benchText}`)}`, "_blank");
  };

  const numTeams = Math.floor(selected.length / playersPerTeam);
  const remainder = selected.length % playersPerTeam;

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      <p className="text-gray-400">Loading players...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">← Back</button>
        <span className="font-bold">Team Picker 🎲</span>
        <span />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Who's playing */}
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-1">Who's playing tonight? 🙋</h2>
          <p className="text-gray-400 text-sm mb-4">Tap to toggle. Everyone confirmed is pre-selected.</p>
          <div className="flex flex-wrap gap-2">
            {allPlayers.map(p => {
              const on = selected.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePlayer(p.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold transition ${on ? "bg-brand-orange text-white" : "bg-gray-700 text-gray-400"}`}>
                  {p.shirtNumber ? `#${p.shirtNumber} ` : ""}{p.name}
                </button>
              );
            })}
          </div>
          <p className="text-gray-500 text-xs mt-3">{selected.length} players selected</p>
        </div>

        {/* Players per team */}
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-1">Players per team 👥</h2>
          <p className="text-gray-400 text-sm mb-4">
            {selected.length} players → {numTeams} team{numTeams !== 1 ? "s" : ""} of {playersPerTeam}
            {remainder > 0 ? ` + ${remainder} on bench 🪑` : " 🎯"}
          </p>
          <div className="flex gap-2">
            {[3, 4, 5, 6, 7].map(n => (
              <button key={n} onClick={() => { setPlayersPerTeam(n); setTeams(null); setSaved(false); }}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                  playersPerTeam === n ? "bg-brand-orange text-white" : "bg-gray-700 text-gray-400 hover:text-white"
                }`}>
                {n}v{n}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button onClick={generate}
          disabled={selected.length < playersPerTeam * 2 || shuffles > MAX_SHUFFLES}
          className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-lg">
          {teams ? `🔀 Shuffle Again (${MAX_SHUFFLES - shuffles + 1} left)` : "🎲 Make Teams!"}
        </button>
        {selected.length < playersPerTeam * 2 && (
          <p className="text-gray-500 text-xs text-center -mt-4">
            Need at least {playersPerTeam * 2} players for {playersPerTeam}v{playersPerTeam}
          </p>
        )}

        {/* Teams result */}
        {teams && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team, i) => {
                const c = TEAM_COLORS[i] || { light: "bg-gray-800", text: "text-gray-300", label: `Team ${i+1}` };
                return (
                  <div key={i} className={`rounded-2xl p-4 ${c.light}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-bold text-sm ${c.text}`}>{c.label}</h3>
                      <span className={`text-xs font-bold ${c.text}`}>avg {teamAvg(team)}</span>
                    </div>
                    <div className="space-y-2">
                      {team.map(p => (
                        <div key={p.id}>
                          <span className="text-white text-sm">
                            {p.shirtNumber ? <span className="text-gray-400">#{p.shirtNumber} </span> : ""}
                            {p.name}
                          </span>
                          <p className="text-gray-500 text-xs">
                            {p.weight ? `${p.weight}kg` : ""}{p.weight && p.height ? " · " : ""}{p.height ? `${p.height}cm` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bench */}
            {bench.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold text-gray-400 mb-2">🪑 Bench ({bench.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {bench.map(p => (
                    <span key={p.id} className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
                      {p.shirtNumber ? `#${p.shirtNumber} ` : ""}{p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || saved}
                className={`flex-1 font-bold py-3 rounded-xl transition ${saved ? "bg-green-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"}`}>
                {saved ? "Saved ✅" : saving ? "Saving..." : "Save Teams 💾"}
              </button>
              <button onClick={handleShare}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
                Share on WhatsApp 📲
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TEAM_COLORS = [
  { bg: "bg-orange-500", light: "bg-orange-900/40", text: "text-orange-300", label: "Team 1 🟠" },
  { bg: "bg-blue-500",   light: "bg-blue-900/40",   text: "text-blue-300",   label: "Team 2 🔵" },
];

function balanceTeams(players) {
  // Compute a combined score: skill (overall) + physical score (weight + height normalized)
  const withScore = players.map(p => {
    const skill = parseFloat(p.averages?.overall || 5);
    const weight = parseFloat(p.weight || 75);
    const height = parseFloat(p.height || 175);
    // Normalize physical: weight 50-120kg, height 160-210cm
    const physicalScore = ((weight - 50) / 70 + (height - 160) / 50) * 2.5;
    return { ...p, _score: skill + physicalScore };
  });

  // Sort by combined score descending, snake-draft into 2 teams
  const sorted = withScore.sort((a, b) => b._score - a._score);
  const teams = [[], []];
  sorted.forEach((p, i) => {
    const slot = Math.floor(i / 2) % 2 === 0 ? i % 2 : 1 - (i % 2);
    teams[slot].push(p);
  });
  return teams;
}

function teamAvg(team) {
  if (!team.length) return "—";
  const scores = team.map(p => parseFloat(p.averages?.overall || 0));
  return (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
}

export default function TeamPicker() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [allPlayers, setAllPlayers] = useState([]);
  const [selected, setSelected]     = useState([]);
  const [locked, setLocked]         = useState({});
  const [teams, setTeams]           = useState(null);
  const [shuffles, setShuffles]     = useState(0);
  const [saved, setSaved]           = useState(false);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const MAX_SHUFFLES = 3;

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: sessions } = await api.get("/sessions");
        const session = sessions.find(s => s.id === parseInt(sessionId));
        const confirmed = session?.attendance
          .filter(a => a.confirmed)
          .map(a => a.user) || [];

        const { data: users } = await api.get("/users");
        const withStats = confirmed.map(c => users.find(u => u.id === c.id) || c);
        setAllPlayers(withStats);
        setSelected(withStats.map(p => p.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  const togglePlayer = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setTeams(null);
    setSaved(false);
  };

  const toggleLock = (playerId, teamIdx) => {
    setLocked(l => {
      const next = { ...l };
      if (next[playerId] === teamIdx) delete next[playerId];
      else next[playerId] = teamIdx;
      return next;
    });
    setTeams(null);
    setSaved(false);
  };

  const generate = () => {
    const playing = allPlayers.filter(p => selected.includes(p.id));
    const lockedT0 = playing.filter(p => locked[p.id] === 0);
    const lockedT1 = playing.filter(p => locked[p.id] === 1);
    const free     = playing.filter(p => locked[p.id] === undefined);

    const [b0, b1] = balanceTeams(free);
    setTeams([
      [...lockedT0, ...b0],
      [...lockedT1, ...b1],
    ]);
    setShuffles(s => s + 1);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!teams) return;
    setSaving(true);
    try {
      await api.post(`/teams/session/${sessionId}`, {
        teams: teams.map((t, i) => ({ teamNumber: i + 1, playerIds: t.map(p => p.id) })),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (!teams) return;
    const text = teams.map((t, i) =>
      `${TEAM_COLORS[i].label}:\n${t.map(p => `• ${p.shirtNumber ? `#${p.shirtNumber} ` : ""}${p.name}`).join("\n")}`
    ).join("\n\n");
    const url = `https://wa.me/?text=${encodeURIComponent(`🏀 Tonight's Teams!\n\n${text}`)}`;
    window.open(url, "_blank");
  };

  if (loading) return <Screen><p className="text-gray-400">Loading players...</p></Screen>;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">← Back</button>
        <span className="font-bold">Team Picker 🎲</span>
        <span />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Step 1 — Who's playing */}
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-1">Who's playing tonight? 🙋</h2>
          <p className="text-gray-400 text-sm mb-4">Tap to toggle. Everyone confirmed is pre-selected.</p>
          <div className="flex flex-wrap gap-2">
            {allPlayers.map(p => {
              const on = selected.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePlayer(p.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold transition ${
                    on ? "bg-brand-orange text-white" : "bg-gray-700 text-gray-400"
                  }`}>
                  {p.shirtNumber ? `#${p.shirtNumber} ` : ""}{p.name}
                </button>
              );
            })}
          </div>
          <p className="text-gray-500 text-xs mt-3">{selected.length} players selected</p>
        </div>

        {/* Generate button */}
        <button onClick={generate}
          disabled={selected.length < 2 || shuffles > MAX_SHUFFLES}
          className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-lg">
          {teams ? `🔀 Shuffle Again (${MAX_SHUFFLES - shuffles + 1} left)` : "🎲 Make Teams!"}
        </button>

        {/* Teams result */}
        {teams && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team, i) => {
                const c = TEAM_COLORS[i];
                return (
                  <div key={i} className={`rounded-2xl p-4 ${c.light}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-bold ${c.text}`}>{c.label}</h3>
                      <span className={`text-xs font-bold ${c.text}`}>avg {teamAvg(team)}</span>
                    </div>
                    <div className="space-y-2">
                      {team.map(p => (
                        <div key={p.id} className="flex items-center justify-between">
                          <div>
                            <span className="text-white text-sm">
                              {p.shirtNumber ? <span className="text-gray-400">#{p.shirtNumber} </span> : ""}
                              {p.name}
                            </span>
                            <p className="text-gray-500 text-xs">
                              {p.weight ? `${p.weight}kg` : ""}{p.weight && p.height ? " · " : ""}{p.height ? `${p.height}cm` : ""}
                            </p>
                          </div>
                          <button onClick={() => toggleLock(p.id, i === 0 ? 1 : 0)}
                            title="Move to other team"
                            className="text-gray-500 hover:text-white text-xs transition">
                            🔒
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || saved}
                className={`flex-1 font-bold py-3 rounded-xl transition ${
                  saved ? "bg-green-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}>
                {saved ? "Saved ✅" : saving ? "Saving..." : "Save Teams 💾"}
              </button>
              <button onClick={handleShare}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
                Share on WhatsApp 📲
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Screen({ children }) {
  return <div className="min-h-screen bg-brand-dark flex items-center justify-center">{children}</div>;
}
    teams[slot].push(p);
  });
  return teams;
}floor(i / 2) % 2 === 0 ? i % 2 : 1 - (i % 2);
    teams[slot].push(p);
  });
  return teams;
}

function teamAvg(team) {
  if (!team.length) return "—";
  const scores = team.map(p => parseFloat(p.averages?.overall || 0));
  return (scores.reduce((s, v) => s + v, 0) / scores.length).toFixed(1);
}

export default function TeamPicker() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [allPlayers, setAllPlayers] = useState([]);
  const [selected, setSelected]     = useState([]);
  const [locked, setLocked]         = useState({}); // { playerId: 0 | 1 }
  const [teams, setTeams]           = useState(null);
  const [shuffles, setShuffles]     = useState(0);
  const [saved, setSaved]           = useState(false);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const MAX_SHUFFLES = 3;

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: sessions } = await api.get("/sessions");
        const session = sessions.find(s => s.id === parseInt(sessionId));
        const confirmed = session?.attendance
          .filter(a => a.confirmed)
          .map(a => a.user) || [];

        const { data: users } = await api.get("/users");
        const withStats = confirmed.map(c => users.find(u => u.id === c.id) || c);
        setAllPlayers(withStats);
        setSelected(withStats.map(p => p.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  const togglePlayer = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setTeams(null);
    setSaved(false);
  };

  const toggleLock = (playerId, teamIdx) => {
    setLocked(l => {
      const next = { ...l };
      if (next[playerId] === teamIdx) delete next[playerId];
      else next[playerId] = teamIdx;
      return next;
    });
    setTeams(null);
    setSaved(false);
  };

  const generate = () => {
    const playing = allPlayers.filter(p => selected.includes(p.id));
    const lockedT0 = playing.filter(p => locked[p.id] === 0);
    const lockedT1 = playing.filter(p => locked[p.id] === 1);
    const free     = playing.filter(p => locked[p.id] === undefined);

    const [b0, b1] = balanceTeams(free);
    setTeams([
      [...lockedT0, ...b0],
      [...lockedT1, ...b1],
    ]);
    setShuffles(s => s + 1);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!teams) return;
    setSaving(true);
    try {
      await api.post(`/teams/session/${sessionId}`, {
        teams: teams.map((t, i) => ({ teamNumber: i + 1, playerIds: t.map(p => p.id) })),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    if (!teams) return;
    const text = teams.map((t, i) =>
      `${TEAM_COLORS[i].label}:\n${t.map(p => `• ${p.shirtNumber ? `#${p.shirtNumber} ` : ""}${p.name}`).join("\n")}`
    ).join("\n\n");
    const url = `https://wa.me/?text=${encodeURIComponent(`🏀 Tonight's Teams!\n\n${text}`)}`;
    window.open(url, "_blank");
  };

  if (loading) return <Screen><p className="text-gray-400">Loading players...</p></Screen>;

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">← Back</button>
        <span className="font-bold">Team Picker 🎲</span>
        <span />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Step 1 — Who's playing */}
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-1">Who's playing tonight? 🙋</h2>
          <p className="text-gray-400 text-sm mb-4">Tap to toggle. Everyone confirmed is pre-selected.</p>
          <div className="flex flex-wrap gap-2">
            {allPlayers.map(p => {
              const on = selected.includes(p.id);
              return (
                <button key={p.id} onClick={() => togglePlayer(p.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold transition ${
                    on ? "bg-brand-orange text-white" : "bg-gray-700 text-gray-400"
                  }`}>
                  {p.shirtNumber ? `#${p.shirtNumber} ` : ""}{p.name}
                </button>
              );
            })}
          </div>
          <p className="text-gray-500 text-xs mt-3">{selected.length} players selected</p>
        </div>

        {/* Generate button */}
        <button onClick={generate}
          disabled={selected.length < 2}
          className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-lg">
          {teams ? `🔀 Shuffle Again (${MAX_SHUFFLES - shuffles + 1} left)` : "🎲 Make Teams!"}
        </button>

        {/* Teams result */}
        {teams && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {teams.map((team, i) => {
                const c = TEAM_COLORS[i];
                return (
                  <div key={i} className={`rounded-2xl p-4 ${c.light}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`font-bold ${c.text}`}>{c.label}</h3>
                      <span className={`text-xs font-bold ${c.text}`}>avg {teamAvg(team)}</span>
                    </div>
                    <div className="space-y-2">
                      {team.map(p => (
                        <div key={p.id} className="flex items-center justify-between">
                          <span className="text-white text-sm">
                            {p.shirtNumber ? <span className="text-gray-400">#{p.shirtNumber} </span> : ""}
                            {p.name}
                          </span>
                          {/* Lock button — swap team */}
                          <button onClick={() => toggleLock(p.id, i === 0 ? 1 : 0)}
                            title="Move to other team"
                            className="text-gray-500 hover:text-white text-xs transition">
                            🔒
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || saved}
                className={`flex-1 font-bold py-3 rounded-xl transition ${
                  saved ? "bg-green-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}>
                {saved ? "Saved ✅" : saving ? "Saving..." : "Save Teams 💾"}
              </button>
              <button onClick={handleShare}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
                Share on WhatsApp 📲
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Screen({ children }) {
  return <div className="min-h-screen bg-brand-dark flex items-center justify-center">{children}</div>;
}