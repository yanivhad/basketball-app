import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";
import RatingSlider from "../components/RatingSlider";

const CATEGORIES = [
  { key: "athleticism", label: "🏃 Athleticism" },
  { key: "shooting",    label: "🎯 Shooting" },
  { key: "passing",     label: "🤝 Passing" },
  { key: "defense",     label: "🛡️ Defense" },
  { key: "basketballIq",label: "🧠 Basketball IQ" },
  { key: "hustle",      label: "🔥 Hustle" },
  { key: "vibe",        label: "😎 Vibe" },
];

const defaultScores = () => Object.fromEntries(CATEGORIES.map(c => [c.key, 5]));

export default function RatePlayers() {
  const { sessionId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scores, setScores] = useState(defaultScores());
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackAnon, setFeedbackAnon] = useState(false);
  const [submitted, setSubmitted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/sessions`);
        const session = data.find(s => s.id === parseInt(sessionId));
        if (!session) return navigate("/dashboard");
        const others = session.attendance
          .filter(a => a.actuallyPlayed && a.user.id !== user.id && a.user.status === "active")
          .map(a => a.user);
        setPlayers(others);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sessionId]);

  const current = players[currentIdx];

  const handleScore = (key, val) => setScores(s => ({ ...s, [key]: val }));

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.post("/ratings", {
        sessionId: parseInt(sessionId),
        ratedUserId: current.id,
        isAnonymous,
        ...scores,
      });
      if (feedback.trim()) {
        await api.post("/feedback", {
          sessionId: parseInt(sessionId),
          toUserId: current.id,
          message: feedback.trim(),
          isAnonymous: feedbackAnon,
        });
      }
      setSubmitted(s => [...s, current.id]);
      if (currentIdx + 1 >= players.length) {
        setDone(true);
      } else {
        setCurrentIdx(i => i + 1);
        setScores(defaultScores());
        setIsAnonymous(false);
        setFeedback("");
        setFeedbackAnon(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Screen><p className="text-gray-400">Loading players...</p></Screen>;
  if (players.length === 0) return <Screen><p className="text-gray-400">No other players to rate 👀</p></Screen>;

  if (done) return (
    <Screen>
      <div className="text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">All done!</h2>
        <p className="text-gray-400 mb-6">You've rated everyone. Good game! 🏀</p>
        <button onClick={() => navigate("/dashboard")}
          className="bg-brand-orange hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition">
          Back to Dashboard
        </button>
      </div>
    </Screen>
  );

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">← Back</button>
        <span className="font-bold">Rate Players</span>
        <span className="text-gray-400 text-sm">{currentIdx + 1} / {players.length}</span>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Player header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏀</div>
          <h2 className="text-2xl font-bold">
            {current.shirtNumber ? `#${current.shirtNumber} ` : ""}{current.name}
          </h2>
          <p className="text-gray-400 text-sm mt-1">How did they play tonight?</p>
        </div>

        {/* Rating sliders */}
        <div className="bg-brand-card rounded-2xl p-5 space-y-4 mb-4">
          {CATEGORIES.map(c => (
            <RatingSlider key={c.key} label={c.label} value={scores[c.key]}
              onChange={v => handleScore(c.key, v)} />
          ))}
        </div>

        {/* Anonymous toggle */}
        <div className="bg-brand-card rounded-2xl p-4 mb-4 flex items-center justify-between">
          <span className="text-gray-300 text-sm">Post anonymously?</span>
          <button onClick={() => setIsAnonymous(a => !a)}
            className={`w-12 h-6 rounded-full transition-colors ${isAnonymous ? "bg-brand-orange" : "bg-gray-600"}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${isAnonymous ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Optional feedback */}
        <div className="bg-brand-card rounded-2xl p-4 mb-6">
          <label className="text-gray-300 text-sm mb-2 block">Leave a note (optional)</label>
          <textarea
            value={feedback} onChange={e => setFeedback(e.target.value)}
            maxLength={200} rows={2} placeholder="Something they did well, or could improve..."
            className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setFeedbackAnon(a => !a)}
                className={`w-10 h-5 rounded-full transition-colors ${feedbackAnon ? "bg-brand-orange" : "bg-gray-600"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${feedbackAnon ? "translate-x-5" : "translate-x-0"}`} />
              </button>
              <span className="text-gray-400 text-xs">Anonymous note</span>
            </div>
            <span className="text-gray-500 text-xs">{feedback.length}/200</span>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={saving}
          className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
          {saving ? "Saving..." : currentIdx + 1 < players.length ? "Next Player →" : "Finish 🎉"}
        </button>
      </div>
    </div>
  );
}

function Screen({ children }) {
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center">
      {children}
    </div>
  );
}