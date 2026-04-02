import { useState } from "react";
import api from "../api/axios";

export default function MarkAttendanceModal({ session, onClose, onDone }) {
  // Pre-select everyone who confirmed
  const confirmedIds = session.attendance?.filter(a => a.confirmed).map(a => a.user.id) || [];
  const [actualIds, setActualIds] = useState(confirmedIds);
  const [saving, setSaving] = useState(false);

  const allPlayers = session.attendance?.map(a => a.user) || [];

  const toggle = (id) => {
    setActualIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.patch(`/sessions/${session.id}/complete`, { actualPlayerIds: actualIds });
      onDone();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-brand-card rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-white font-bold text-xl mb-1">Who actually showed up? 🏀</h2>
        <p className="text-gray-400 text-sm mb-5">
          Pre-selected are those who confirmed. Adjust if needed.
        </p>

        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {allPlayers.map(p => {
            const confirmed = confirmedIds.includes(p.id);
            const actual = actualIds.includes(p.id);
            return (
              <div key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                  actual ? "bg-green-900/40 border border-green-700" : "bg-brand-dark border border-gray-700"
                }`}>
                <div>
                  <p className="text-white text-sm font-bold">
                    {p.shirtNumber ? <span className="text-brand-orange">#{p.shirtNumber} </span> : ""}
                    {p.name}
                  </p>
                  <p className="text-xs mt-0.5">
                    {confirmed
                      ? <span className="text-green-400">✅ Confirmed</span>
                      : <span className="text-gray-500">❌ Didn't confirm</span>}
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${
                  actual ? "bg-green-500 border-green-500" : "border-gray-600"
                }`}>
                  {actual && <span className="text-white text-xs font-bold">✓</span>}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-gray-400 text-xs mb-4 text-center">
          {actualIds.length} player{actualIds.length !== 1 ? "s" : ""} marked as present
        </p>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
            {saving ? "Saving..." : "Mark Done ✅"}
          </button>
        </div>
      </div>
    </div>
  );
}