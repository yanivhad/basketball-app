import express from "express";
import prisma from "../prismaClient.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/feedback — leave feedback for a player
router.post("/", requireAuth, async (req, res) => {
  const { sessionId, toUserId, message } = req.body;
  const fromUserId = req.user.userId;

  if (!message || message.trim().length === 0)
    return res.status(400).json({ error: "Message can't be empty" });

  if (message.length > 200)
    return res.status(400).json({ error: "Message too long (max 200 chars)" });

  if (fromUserId === toUserId)
    return res.status(400).json({ error: "You can't leave feedback for yourself 😄" });

  try {
    const feedback = await prisma.feedback.create({
      data: { sessionId, fromUserId, toUserId, message: message.trim() },
    });
    res.status(201).json({ message: "Feedback sent 💬", feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/feedback/user/:userId — get all feedback for a player
router.get("/user/:userId", requireAuth, async (req, res) => {
  try {
    const feedback = await prisma.feedback.findMany({
      where: { toUserId: parseInt(req.params.userId) },
      orderBy: { createdAt: "desc" },
      include: {
        fromUser: { select: { name: true } },
        session: { select: { date: true } },
      },
    });

    const sanitized = feedback.map(f => ({
      ...f,
      fromUser: f.isAnonymous ? { name: "Anonymous" } : f.fromUser,
    }));

    res.json(sanitized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;