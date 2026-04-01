import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/teams/session/:sessionId — get saved teams for a session
router.get("/session/:sessionId", requireAuth, async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: { sessionId: parseInt(req.params.sessionId) },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, shirtNumber: true } } },
        },
      },
      orderBy: { teamNumber: "asc" },
    });
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/teams/session/:sessionId — save generated teams (admin only)
router.post("/session/:sessionId", requireAuth, requireAdmin, async (req, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const { teams } = req.body; // [{ teamNumber, playerIds[] }, ...]

  try {
    // Delete existing teams for this session first
    const existing = await prisma.team.findMany({ where: { sessionId } });
    for (const t of existing) {
      await prisma.teamMember.deleteMany({ where: { teamId: t.id } });
    }
    await prisma.team.deleteMany({ where: { sessionId } });

    // Create new teams
    for (const t of teams) {
      const team = await prisma.team.create({
        data: { sessionId, teamNumber: t.teamNumber },
      });
      for (const userId of t.playerIds) {
        await prisma.teamMember.create({ data: { teamId: team.id, userId } });
      }
    }

    res.status(201).json({ message: "Teams saved 🏀" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;