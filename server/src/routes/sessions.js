import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/sessions — get all sessions
router.get("/", requireAuth, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: { date: "desc" },
      include: {
        createdBy: { select: { name: true } },
        attendance: { include: { user: { select: { id: true, name: true, shirtNumber: true } } } },
      },
    });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/sessions — create a session (admin only)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { date, location } = req.body;
  if (!date) return res.status(400).json({ error: "Date is required" });

  try {
    const session = await prisma.session.create({
      data: {
        date: new Date(date),
        location: location || null,
        createdById: req.user.userId,
      },
    });
    res.status(201).json({ message: "Session created 🏀", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// PATCH /api/sessions/:id/complete — mark session as completed (admin only)
router.patch("/:id/complete", requireAuth, requireAdmin, async (req, res) => {
  try {
    const session = await prisma.session.update({
      where: { id: parseInt(req.params.id) },
      data: { status: "completed" },
    });
    res.json({ message: "Session marked as completed ✅", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/sessions/:id/attend — confirm attendance
router.post("/:id/attend", requireAuth, async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    const attendance = await prisma.attendance.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: { confirmed: true },
      create: { sessionId, userId, confirmed: true },
    });
    res.json({ message: "Attendance confirmed 🙌", attendance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/sessions/:id/unattend — cancel attendance
router.post("/:id/unattend", requireAuth, async (req, res) => {
  const sessionId = parseInt(req.params.id);
  const userId = req.user.userId;

  try {
    await prisma.attendance.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: { confirmed: false },
      create: { sessionId, userId, confirmed: false },
    });
    res.json({ message: "Attendance cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;