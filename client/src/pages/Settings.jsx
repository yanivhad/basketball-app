import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import useAuthStore from "../store/useAuthStore";

const TIMING_OPTIONS = [
  { value: "one_hour",    label: "1 hour before" },
  { value: "three_hours", label: "3 hours before" },
  { value: "morning",     label: "Morning of game day (9am)" },
];

export default function Settings() {
  const { user, login } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    whatsappNumber: "",
    whatsappAlerts: false,
    alertTiming: "one_hour",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/users/${user.id}`)
      .then(({ data }) => {
        setForm({
          whatsappNumber: data.whatsappNumber || "",
          whatsappAlerts: data.whatsappAlerts || false,
          alertTiming: data.alertTiming || "one_hour",
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (form.whatsappAlerts && !form.whatsappNumber.trim())
      return setError("Add your WhatsApp number to enable alerts");

    setSaving(true);
    setError("");
    try {
      const { data } = await api.patch(`/users/${user.id}/settings`, form);
      // Update auth store with fresh user data
      const token = localStorage.getItem("token");
      login(data.user, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center text-gray-400">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <nav className="flex items-center justify-between px-6 py-4 bg-brand-card shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">← Back</button>
        <span className="font-bold">Settings ⚙️</span>
        <span />
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-5">

        {/* Profile info */}
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-4">Your Profile 👤</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name</span>
              <span className="text-white font-bold">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Username</span>
              <span className="text-white">@{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role</span>
              <span className={`font-bold ${user.role === "admin" ? "text-brand-orange" : "text-gray-300"}`}>
                {user.role === "admin" ? "👑 Admin" : "🏀 Player"}
              </span>
            </div>
          </div>
        </div>

        {/* WhatsApp alerts */}
        <div className="bg-brand-card rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-1">WhatsApp Alerts 📲</h2>
          <p className="text-gray-400 text-sm mb-4">Get a reminder before each game night</p>

          <div className="space-y-4">
            {/* Number input */}
            <div>
              <label className="text-gray-300 text-sm mb-1 block">Your WhatsApp number</label>
              <input
                value={form.whatsappNumber}
                onChange={e => setForm(f => ({ ...f, whatsappNumber: e.target.value }))}
                placeholder="+972501234567"
                className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition text-sm"
              />
              <p className="text-gray-500 text-xs mt-1">Include country code e.g. +972 for Israel</p>
            </div>

            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <span className="text-gray-300 text-sm">Enable reminders</span>
              <button onClick={() => setForm(f => ({ ...f, whatsappAlerts: !f.whatsappAlerts }))}
                className={`w-12 h-6 rounded-full transition-colors ${form.whatsappAlerts ? "bg-brand-orange" : "bg-gray-600"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.whatsappAlerts ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>

            {/* Timing selector */}
            {form.whatsappAlerts && (
              <div>
                <label className="text-gray-300 text-sm mb-2 block">When to remind me</label>
                <div className="space-y-2">
                  {TIMING_OPTIONS.map(opt => (
                    <button key={opt.value}
                      onClick={() => setForm(f => ({ ...f, alertTiming: opt.value }))}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition border ${
                        form.alertTiming === opt.value
                          ? "border-brand-orange bg-brand-orange/10 text-white font-bold"
                          : "border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <button onClick={handleSave} disabled={saving}
          className={`w-full font-bold py-3 rounded-xl transition ${
            saved ? "bg-green-600 text-white" : "bg-brand-orange hover:bg-orange-600 text-white disabled:opacity-50"
          }`}>
          {saved ? "Saved! ✅" : saving ? "Saving..." : "Save Settings"}
        </button>

        {/* Logout */}
        <button onClick={() => { useAuthStore.getState().logout(); navigate("/login"); }}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition">
          Logout 👋
        </button>
      </div>
    </div>
  );
}