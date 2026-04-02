import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import ratingRoutes from "./routes/ratings.js";
import feedbackRoutes from "./routes/feedback.js";
import userRoutes from "./routes/users.js";
import teamRoutes from "./routes/teams.js";
import { startScheduler } from "./services/scheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://basketball-app-peach.vercel.app",
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Basketball app is running 🏀" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startScheduler();
});