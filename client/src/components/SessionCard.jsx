import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import MarkAttendanceModal from "./MarkAttendanceModal";

const TEAM_COLORS = [
  { bg: "bg-orange-900/40", text: "text-orange-300", label: "Team 1 🟠" },
  { bg: "bg-blue-900/40",   text: "text-blue-300",   label: "Team 2 🔵" },
  { bg: "bg-green-900/40",  text: "text-green-300",  label: "Team 3 🟢" },
  { bg: "bg-purple-900/40", text: "text-purple-300", label: "Team 4 🟣" },
];

export default function SessionCard({ session, currentUser, onAttend, onRefresh }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [teams, setTeams] = useState([]);

  const isAttending = session.attendance?.some(
    a => a.user.id === currentUser?.id && a.confirmed
  );
  const attendees = session.attendance?.filter(a => a.confirmed) || [];
  const isUpcoming = session.status === "upcoming";

  useEffect(() => {
    api.get(`/teams/session/${session.id}`)
      .then(({ data }) => setTeams(Array.isArray(data) ? data : data.teams || []))
      .catch(() => setTeams([]));
  }, [session.id]);

  const handleComplete = async () => {
    try {
      await api.patch(`/sessions/${session.id}/complete`);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReopen = async () => {
    try {
      await api.patch(`/sessions/${session.id}/reopen`);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-brand-card rounded-2xl p-5 shadow">

      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-white font-bold text-lg">
            {new Date(session.date).toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long"
            })}
          </p>
          <p className="text-gray-400 text-sm">
            🕗 {new Date(session.date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            {session.location && ` · 📍 ${session.location}`}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isUpcoming ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
          {isUpcoming ? "Upcoming" : "Done"}
        </span>
      </div>

      {/* Attendees */}
      <div className="mb-4">
        <p className="text-gray-400 text-xs mb-1">
          Who's in ({attendees.length}{session.maxPlayers ? `/${session.maxPlayers}` : ""})
          {session.maxPlayers && attendees.length >= session.maxPlayers
            ? <span className="text-red-400 ml-2">Session full! 🚫</span>
            : null}
        </p>
        <div className="flex flex-wrap gap-2">
          {attendees.length === 0 ? (
            <span className="text-gray-500 text-sm">Nobody confirmed yet 👀</span>
          ) : (
            attendees.map(a => (
              <span key={a.user.id} className="bg-brand-dark text-white text-xs px-3 py-1 rounded-full">
                {a.user.shirtNumber ? `#${a.user.shirtNumber} ` : ""}{a.user.name}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Teams */}
      {teams.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-400 text-xs mb-2">Tonight's Teams 🎲</p>
          <div className="grid grid-cols-2 gap-2">
            {teams.map((team, i) => {
              const c = TEAM_COLORS[i] || { bg: "bg-gray-800", text: "text-gray-300", label: `Team ${i + 1}` };
              return (
                <div key={team.id} className={`rounded-xl p-3 ${c.bg}`}>
                  <p className={`text-xs font-bold mb-1 ${c.text}`}>{c.label}</p>
                  <div className="space-y-0.5">
                    {team.members.map(m => (
                      <p key={m.user.id} className="text-white text-xs">
                        {m.user.shirtNumber ? <span className="text-gray-400">#{m.user.shirtNumber} </span> : ""}
                        {m.user.name}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      {isUpcoming && (
        <div className="flex gap-2">
          <button
            onClick={() => onAttend(session.id, !isAttending)}
            className={`flex-1 font-bold py-2 rounded-xl text-sm transition ${
              isAttending
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-brand-orange hover:bg-orange-600 text-white"
            }`}
          >
            {isAttending ? "I'm out 😔" : "I'm in! 🙌"}
          </button>
          {currentUser?.role === "admin" && (
            <>
              <button
                onClick={() => navigate(`/teams/${session.id}`)}
                className="bg-blue-700 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
              >
                🎲 Teams
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
              >
                ✅
              </button>
            </>
          )}
        </div>
      )}
      {!isUpcoming && (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/rate/${session.id}`)}
            className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-sm transition"
          >
            ⭐ Rate Players
          </button>
          {currentUser?.role === "admin" && (
            <button
              onClick={handleReopen}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
            >
              🔄 Reopen
            </button>
          )}
        </div>
      )}

      {showModal && (
        <MarkAttendanceModal
          session={session}
          onClose={() => setShowModal(false)}
          onDone={() => { setShowModal(false); onRefresh(); }}
        />
      )}
    </div>
  );
}