import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function PendingRatingBanner() {
  const [pending, setPending] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/ratings/pending")
      .then(({ data }) => setPending(data.pending))
      .catch(console.error);
  }, []);

  if (!pending) return null;

  const date = new Date(pending.date).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div className="bg-brand-orange/10 border border-brand-orange rounded-2xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⭐</span>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">You have pending ratings!</p>
          <p className="text-gray-300 text-xs mt-0.5">
            Rate your teammates from <span className="text-brand-orange">{date}</span>
            {pending.location ? ` at ${pending.location}` : ""}.
            {pending.rated > 0 ? ` (${pending.rated}/${pending.total} done)` : ""}
          </p>
        </div>
        <button
          onClick={() => navigate(`/rate/${pending.sessionId}`)}
          className="bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition shrink-0">
          Rate Now →
        </button>
      </div>
    </div>
  );
}