import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/users — get all active players
router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { status: "active" },
      select: {
        id: true, name: true, username: true,
        shirtNumber: true, role: true, status: true, createdAt: true,
        ratingsReceived: true,
        attendance: { where: { confirmed: true } },
      },
      orderBy: { name: "asc" },
    });

    const withStats = users.map(u => {
      const r = u.ratingsReceived;
      const avg = key => r.length ? (r.reduce((s, x) => s + x[key], 0) / r.length).toFixed(1) : null;
      const cats = ["athleticism","shooting","passing","defense","basketballIq","hustle","vibe","size"];
      const overall = r.length
        ? (cats.reduce((s, k) => s + parseFloat(avg(k)), 0) / cats.length).toFixed(1)
        : null;
      return {
        id: u.id, name: u.name, username: u.username,
        shirtNumber: u.shirtNumber, role: u.role, status: u.status,
        attendanceCount: u.attendance.length,
        totalRatings: r.length,
        averages: r.length ? {
          athleticism: avg("athleticism"), shooting: avg("shooting"),
          passing: avg("passing"), defense: avg("defense"),
          basketballIq: avg("basketballIq"), hustle: avg("hustle"),
          vibe: avg("vibe"), size: avg("size"), overall,
        } : null,
      };
    });

    res.json(withStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/users/:id — get single player profile
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const u = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true, name: true, username: true,
        shirtNumber: true, role: true, status: true, createdAt: true,
        ratingsReceived: true,
        attendance: {
          where: { confirmed: true },
          include: { session: { select: { date: true, status: true } } },
        },
        feedbackReceived: {
          orderBy: { createdAt: "desc" },
          include: {
            fromUser: { select: { name: true } },
            session: { select: { date: true } },
          },
        },
      },
    });

    if (!u) return res.status(404).json({ error: "Player not found" });

    const r = u.ratingsReceived;
    const avg = key => r.length ? (r.reduce((s, x) => s + x[key], 0) / r.length).toFixed(1) : null;
    const cats = ["athleticism","shooting","passing","defense","basketballIq","hustle","vibe","size"];
    const overall = r.length
      ? (cats.reduce((s, k) => s + parseFloat(avg(k)), 0) / cats.length).toFixed(1)
      : null;

    const feedback = u.feedbackReceived.map(f => ({
      ...f,
      fromUser: f.isAnonymous ? { name: "Anonymous" } : f.fromUser,
    }));

    res.json({
      id: u.id, name: u.name, username: u.username,
      shirtNumber: u.shirtNumber, role: u.role, status: u.status,
      attendanceCount: u.attendance.length,
      totalRatings: r.length,
      averages: r.length ? {
        athleticism: avg("athleticism"), shooting: avg("shooting"),
        passing: avg("passing"), defense: avg("defense"),
        basketballIq: avg("basketballIq"), hustle: avg("hustle"),
        vibe: avg("vibe"), size: avg("size"), overall,
      } : null,
      feedback,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// PATCH /api/users/:id/settings — update WhatsApp settings
router.patch("/:id/settings", requireAuth, async (req, res) => {
  const { whatsappNumber, whatsappAlerts, alertTiming } = req.body;
  if (req.user.userId !== parseInt(req.params.id))
    return res.status(403).json({ error: "You can only update your own settings" });

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { whatsappNumber, whatsappAlerts, alertTiming },
      select: { id: true, name: true, username: true, shirtNumber: true, role: true, whatsappAlerts: true, alertTiming: true },
    });
    res.json({ message: "Settings saved ✅", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// PATCH /api/users/:id/status — toggle active/inactive (admin only)
router.patch("/:id/status", requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!["active", "inactive"].includes(status))
    return res.status(400).json({ error: "Status must be active or inactive" });

  try {
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
    });
    res.json({ message: `Player marked as ${status}`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;