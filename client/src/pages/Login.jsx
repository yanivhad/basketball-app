import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/useAuthStore";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [form, setForm] = useState({ name: "", username: "", password: "", shirtNumber: "" });
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
      if (mode === "login") {
        const { data } = await axios.post(`${BASE}/auth/login`, {
          username: form.username, password: form.password,
        });
        login(data.user, data.token);
        navigate("/dashboard");
      } else {
        await axios.post(`${BASE}/auth/register`, {
          name: form.name,
          username: form.username,
          password: form.password,
          shirtNumber: form.shirtNumber || undefined,
        });
        // Auto login after register
        const { data } = await axios.post(`${BASE}/auth/login`, {
          username: form.username, password: form.password,
        });
        login(data.user, data.token);
        navigate("/dashboard");
      }
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
          <p className="text-gray-400 mt-1">{mode === "login" ? "Welcome back! Let's run it." : "Join the crew 🙌"}</p>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-brand-dark rounded-xl p-1 mb-6">
          <button onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${mode === "login" ? "bg-brand-orange text-white" : "text-gray-400"}`}>
            Login
          </button>
          <button onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${mode === "register" ? "bg-brand-orange text-white" : "text-gray-400"}`}>
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="Yaniv Cohen"
                  className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition" />
              </div>
              <div>
                <label className="text-gray-300 text-sm mb-1 block">Shirt Number (optional)</label>
                <input name="shirtNumber" value={form.shirtNumber} onChange={handleChange}
                  placeholder="23" type="number"
                  className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition" />
              </div>
            </>
          )}

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Username</label>
            <input name="username" value={form.username} onChange={handleChange}
              placeholder="your username"
              className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition" />
          </div>

          <div>
            <label className="text-gray-300 text-sm mb-1 block">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="••••••••"
              className="w-full bg-brand-dark text-white rounded-xl px-4 py-3 outline-none border border-gray-700 focus:border-brand-orange transition" />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? "..." : mode === "login" ? "Let's Ball 🏀" : "Join the Crew 🙌"}
          </button>
        </form>
      </div>
    </div>
  );
}