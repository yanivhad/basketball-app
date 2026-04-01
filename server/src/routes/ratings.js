import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/ratings — submit ratings for a player
router.post("/", requireAuth, async (req, res) => {
  const { sessionId, ratedUserId, isAnonymous, athleticism, shooting, passing, defense, basketballIq, hustle, vibe } = req.body;
  const raterId = req.user.userId;

  if (raterId === ratedUserId)
    return res.status(400).json({ error: "You can't rate yourself 😄" });

  const fields = [athleticism, shooting, passing, defense, basketballIq, hustle, vibe];
  if (fields.some(f => f === undefined || f < 1 || f > 10))
    return res.status(400).json({ error: "All categories must be rated between 1 and 10" });

  try {
    const rating = await prisma.rating.upsert({
      where: { sessionId_raterId_ratedUserId: { sessionId, raterId, ratedUserId } },
      update: { isAnonymous, athleticism, shooting, passing, defense, basketballIq, hustle, vibe, size },
      create: { sessionId, raterId, ratedUserId, isAnonymous: isAnonymous || false, athleticism, shooting, passing, defense, basketballIq, hustle, vibe, size },
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

    // hide rater name if anonymous
    const sanitized = ratings.map(r => ({
      ...r,
      rater: r.isAnonymous ? { name: "Anonymous" } : r.rater,
    }));

    res.json(sanitized);
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
        overall: (["athleticism","shooting","passing","defense","basketballIq","hustle","vibe","size"]
          .reduce((s, k) => s + parseFloat(avg(k)), 0) / 8).toFixed(1),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;