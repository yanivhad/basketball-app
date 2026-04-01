import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { name, username, password, shirtNumber, role } = req.body;

  if (!name || !username || !password)
    return res.status(400).json({ error: "Name, username and password are required" });

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing)
      return res.status(409).json({ error: "Username already taken" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        passwordHash,
        shirtNumber: shirtNumber ? parseInt(shirtNumber) : null,
        role: role === "admin" ? "admin" : "player",
      },
    });

    res.status(201).json({
      message: "User created successfully 🏀",
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Username and password are required" });

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user)
      return res.status(401).json({ error: "Invalid username or password" });

    if (user.status === "inactive")
      return res.status(403).json({ error: "Your account is inactive. Contact the admin." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ error: "Invalid username or password" });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: `Welcome back ${user.name}! 🏀`,
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role, shirtNumber: user.shirtNumber },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;