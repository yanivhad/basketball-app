import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function SessionCard({ session, currentUser, onAttend, onRefresh }) {
  const navigate = useNavigate();
  const isAttending = session.attendance?.some(
    a => a.user.id === currentUser?.id && a.confirmed
  );
  const attendees = session.attendance?.filter(a => a.confirmed) || [];
  const isUpcoming = session.status === "upcoming";

  const handleComplete = async () => {
    try {
      await api.patch(`/sessions/${session.id}/complete`);
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
        <p className="text-gray-400 text-xs mb-1">Who's in ({attendees.length})</p>
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
                onClick={handleComplete}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-xl text-sm transition"
              >
                ✅
              </button>
            </>
          )}
        </div>
      )}
      {!isUpcoming && (
        <button
          onClick={() => navigate(`/rate/${session.id}`)}
          className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-2 rounded-xl text-sm transition"
        >
          ⭐ Rate Players
        </button>
      )}
    </div>
  );
}