import { useState } from "react";
import api from "../api/axios";

export default function CreateSessionModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ date: "", time: "20:00", location: "", maxPlayers: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.date) return setError("Pick a date!");
    setLoading(true);
    try {
      await api.post("/sessions", {
        date: `${form.date}T${form.time}:00`,
        location: form.location || undefined,
        maxPlayers: form.maxPlayers || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="bg-brand-card rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-white font-bold text-xl mb-5">New Game Night 🏀</h2>

        <div className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Date</label>
            <input
              type="date" name="date" value={form.date} onChange={handleChange}
              className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Time</label>
            <input
              type="time" name="time" value={form.time} onChange={handleChange}
              className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Location (optional)</label>
            <input
              type="text" name="location" value={form.location} onChange={handleChange}
              placeholder="e.g. The usual court"
              className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Max Players (optional)</label>
            <input
              type="number" name="maxPlayers" value={form.maxPlayers} onChange={handleChange}
              placeholder="e.g. 10"
              className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-brand-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create 🏀"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}