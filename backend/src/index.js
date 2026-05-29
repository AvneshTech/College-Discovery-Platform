const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// JWT Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secretkey");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

app.get("/", (req, res) => res.send("Backend is running"));

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );
    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
});

// List Colleges with Filters + Pagination
app.get("/api/colleges", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 6));
    const skip = (page - 1) * limit;
    const { search, city, minRating, courseType } = req.query;

    const where = {};
    const andConditions = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
        ],
      });
    }
    if (city) {
      andConditions.push({ city: { contains: city, mode: "insensitive" } });
    }
    if (minRating) {
      andConditions.push({ rating: { gte: parseFloat(minRating) } });
    }
    if (courseType) {
      andConditions.push({
        courses: { contains: courseType, mode: "insensitive" },
      });
    }
    if (andConditions.length > 0) where.AND = andConditions;

    const [total, colleges] = await Promise.all([
      prisma.college.count({ where }),
      prisma.college.findMany({
        where,
        skip,
        take: limit,
        orderBy: { rating: "desc" },
      }),
    ]);

    res.json({
      colleges,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Add College
app.post("/api/colleges", async (req, res) => {
  try {
    const { name, city, rating, fees, courses, overview } = req.body;
    if (!name || !city)
      return res.status(400).json({ message: "Name and city are required" });
    const college = await prisma.college.create({
      data: {
        name,
        city,
        rating: rating ? parseFloat(rating) : 0,
        fees: fees || null,
        courses: courses || null,
        overview: overview || null,
      },
    });
    res.status(201).json(college);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add college" });
  }
});

// Compare Colleges - must be BEFORE /:id
app.post("/api/colleges/compare", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length < 2 || ids.length > 3)
      return res.status(400).json({ message: "Provide 2-3 college ids" });
    const colleges = await prisma.college.findMany({
      where: { id: { in: ids.map(Number) } },
    });
    res.json(colleges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to compare" });
  }
});

// Get Single College
app.get("/api/colleges/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const college = await prisma.college.findUnique({ where: { id } });
    if (!college) return res.status(404).json({ message: "College not found" });
    res.json(college);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch college" });
  }
});

// Saved Colleges - DB backed
app.get("/api/saved", authMiddleware, async (req, res) => {
  try {
    const saved = await prisma.savedCollege.findMany({
      where: { userId: req.user.id },
      include: { college: true },
    });
    res.json(saved.map((s) => s.college));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch saved colleges" });
  }
});

app.post("/api/saved/:collegeId", authMiddleware, async (req, res) => {
  try {
    const collegeId = Number(req.params.collegeId);
    const userId = req.user.id;
    const existing = await prisma.savedCollege.findUnique({
      where: { userId_collegeId: { userId, collegeId } },
    });
    if (existing) return res.status(400).json({ message: "Already saved" });
    await prisma.savedCollege.create({ data: { userId, collegeId } });
    res.status(201).json({ message: "College saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save" });
  }
});

app.delete("/api/saved/:collegeId", authMiddleware, async (req, res) => {
  try {
    const collegeId = Number(req.params.collegeId);
    const userId = req.user.id;
    await prisma.savedCollege.deleteMany({ where: { userId, collegeId } });
    res.json({ message: "Removed from saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove" });
  }
});

// Predictor Tool
app.post("/api/predictor", async (req, res) => {
  try {
    const { exam, rank } = req.body;
    if (!exam || !rank)
      return res.status(400).json({ message: "Exam and rank are required" });
    const rankNum = Number(rank);
    let minRating = 0;
    let tier = "";
    if (rankNum <= 1000) { minRating = 4.7; tier = "Top Tier (Rank ≤ 1000)"; }
    else if (rankNum <= 5000) { minRating = 4.5; tier = "Tier 2 (Rank 1001–5000)"; }
    else if (rankNum <= 20000) { minRating = 4.0; tier = "Tier 3 (Rank 5001–20000)"; }
    else { minRating = 0; tier = "Open Category (Rank > 20000)"; }

    const colleges = await prisma.college.findMany({
      where: { rating: { gte: minRating } },
      orderBy: { rating: "desc" },
      take: 10,
    });
    res.json({ colleges, tier, exam, rank: rankNum });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Prediction failed" });
  }
});

// Discussions
app.get("/api/discussions", async (req, res) => {
  try {
    const discussions = await prisma.discussion.findMany({
      include: {
        author: { select: { id: true, name: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(discussions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch discussions" });
  }
});

app.get("/api/discussions/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        answers: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!discussion)
      return res.status(404).json({ message: "Discussion not found" });
    res.json(discussion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch discussion" });
  }
});

app.post("/api/discussions", authMiddleware, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body)
      return res.status(400).json({ message: "Title and body are required" });
    const discussion = await prisma.discussion.create({
      data: { title, body, authorId: req.user.id },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(discussion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create discussion" });
  }
});

app.post("/api/discussions/:id/answers", authMiddleware, async (req, res) => {
  try {
    const discussionId = Number(req.params.id);
    const { body } = req.body;
    if (!body)
      return res.status(400).json({ message: "Answer body is required" });
    const answer = await prisma.answer.create({
      data: { body, authorId: req.user.id, discussionId },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(answer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to post answer" });
  }
});

// Profile
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
