import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:3001/api/auth/login", form);
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="bg-brand-card rounded-2xl p-8 w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏀</div>
          <h1 className="text-3xl font-bold text-white">Ballers App</h1>
          <p className="text-gray-400 mt-1">Welcome back! Let's run it.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm mb-1 block">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="your username"
              className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Let's Ball 🏀"}
          </button>
        </form>
      </div>
    </div>
  );
}