import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import api from "../api/axios";
import SessionCard from "../components/SessionCard";
import CreateSessionModal from "../components/CreateSessionModal";
import PendingRatingBanner from "../components/PendingRatingBanner";

function CardSkeleton() {
  return (
    <div className="bg-brand-card rounded-2xl p-5 space-y-3 animate-pulse">
      <div className="h-5 w-1/2 bg-gray-700 rounded-xl" />
      <div className="h-4 w-3/4 bg-gray-700 rounded-xl" />
      <div className="h-4 w-2/3 bg-gray-700 rounded-xl" />
      <div className="h-10 w-full bg-gray-700 rounded-xl mt-2" />
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get("/sessions");
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleAttend = async (sessionId, attending) => {
    try {
      await api.post(`/sessions/${sessionId}/${attending ? "attend" : "unattend"}`);
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <div className="flex items-center gap-2 text-xl font-bold">
          <span>🏀</span> Ballers App
        </div>
        <span className="text-gray-400 text-sm">Hey {user?.name}! 👋</span>
      </nav>

      {/* Main */}
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Pending rating banner */}
        <PendingRatingBanner />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Game Nights 🗓️</h1>
          {user?.role === "admin" && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-orange hover:bg-orange-600 text-white font-bold px-4 py-2 rounded-xl transition text-sm"
            >
              + New Session
            </button>
          )}
        </div>

        {/* Sessions */}
        {loading ? (
          <div className="space-y-4">
            <CardSkeleton /><CardSkeleton />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-400 text-center mt-16">No sessions yet. Create one! 🏀</p>
        ) : (
          <div className="space-y-4">
            {sessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                currentUser={user}
                onAttend={handleAttend}
                onRefresh={fetchSessions}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showModal && (
        <CreateSessionModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchSessions(); }}
        />
      )}
    </div>
  );
}