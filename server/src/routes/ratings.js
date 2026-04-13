import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/ratings/pending — check if current user has a completed session they haven't rated yet
router.get("/pending", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find completed sessions where user actually played, most recent first
    const attended = await prisma.attendance.findMany({
      where: { userId, actuallyPlayed: true, session: { status: "completed" } },
      include: {
        session: {
          include: {
            attendance: {
              where: { actuallyPlayed: true },
              include: { user: { select: { id: true, status: true } } },
            },
          },
        },
      },
      orderBy: { session: { date: "desc" } },
    });

    if (!attended.length) return res.json({ pending: null });

    // Go through sessions from most recent and find one with pending ratings
    for (const att of attended) {
      const session = att.session;

      const otherActivePlayers = session.attendance.filter(
        a => a.userId !== userId && a.user.status === "active"
      );

      if (!otherActivePlayers.length) continue;

      const ratingsGiven = await prisma.rating.count({
        where: {
          sessionId: session.id,
          raterId: userId,
          ratedUserId: { in: otherActivePlayers.map(a => a.userId) },
        },
      });

      if (ratingsGiven < otherActivePlayers.length) {
        return res.json({
          pending: {
            sessionId: session.id,
            date: session.date,
            location: session.location,
            rated: ratingsGiven,
            total: otherActivePlayers.length,
          },
        });
      }
    }

    // All sessions fully rated
    return res.json({ pending: null });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/ratings — submit ratings for a player
router.post("/", requireAuth, async (req, res) => {
  const { sessionId, ratedUserId, athleticism, shooting, passing, defense, basketballIq, hustle, vibe } = req.body;
  const raterId = req.user.userId;

  if (raterId === ratedUserId)
    return res.status(400).json({ error: "You can't rate yourself 😄" });

  const fields = [athleticism, shooting, passing, defense, basketballIq, hustle, vibe];
  if (fields.some(f => f === undefined || f < 1 || f > 10))
    return res.status(400).json({ error: "All categories must be rated between 1 and 10" });

  try {
    const rating = await prisma.rating.upsert({
      where: { sessionId_raterId_ratedUserId: { sessionId, raterId, ratedUserId } },
      update: { athleticism, shooting, passing, defense, basketballIq, hustle, vibe },
      create: { sessionId, raterId, ratedUserId, athleticism, shooting, passing, defense, basketballIq, hustle, vibe },
    });
    res.status(201).json({ message: "Rating submitted 🌟", rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/ratings/session/:sessionId — get all ratings for a session
router.get("/session/:sessionId", requireAuth, async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { sessionId: parseInt(req.params.sessionId) },
      include: {
        rater: { select: { name: true } },
        ratedUser: { select: { id: true, name: true, shirtNumber: true } },
      },
    });

    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/ratings/user/:userId — get average ratings for a player
router.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    const ratings = await prisma.rating.findMany({
      where: { ratedUserId: parseInt(req.params.userId) },
    });

    if (ratings.length === 0)
      return res.json({ message: "No ratings yet", averages: null });

    const avg = (key) => (ratings.reduce((s, r) => s + r[key], 0) / ratings.length).toFixed(1);

    res.json({
      totalRatings: ratings.length,
      averages: {
        athleticism: avg("athleticism"),
        shooting: avg("shooting"),
        passing: avg("passing"),
        defense: avg("defense"),
        basketballIq: avg("basketballIq"),
        hustle: avg("hustle"),
        vibe: avg("vibe"),
        overall: (["athleticism","shooting","passing","defense","basketballIq","hustle","vibe"]
          .reduce((s, k) => s + parseFloat(avg(k)), 0) / 7).toFixed(1),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;