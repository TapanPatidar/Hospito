import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(express.json());

// ✅ FIXED CORS FOR VERCEL + LOCAL + PRODUCTION
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://hospito-1jxkr40yj-tapan-patidar-s-projects.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);

// -------------------- HEALTH CHECK --------------------
app.get("/", (req, res) => {
  res.send("Hospito Backend Running 🚀");
});

// -------------------- AUTH ROUTES --------------------

// LOGIN
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    // TODO: replace with DB logic
    if (!email || !password) {
      return res.status(400).json({ detail: "Missing credentials" });
    }

    return res.json({
      token: "dummy-token",
      user: {
        id: "123",
        name: "Test User",
        email
      }
    });
  } catch (err) {
    return res.status(500).json({ detail: "Login error" });
  }
});

// REGISTER
app.post("/api/auth/register", (req, res) => {
  try {
    return res.json({
      message: "User registered successfully"
    });
  } catch (err) {
    return res.status(500).json({ detail: "Register error" });
  }
});

// CURRENT USER
app.get("/api/auth/me", (req, res) => {
  try {
    return res.json({
      user: {
        id: "123",
        name: "Demo User",
        email: "demo@hospito.com"
      }
    });
  } catch (err) {
    return res.status(500).json({ detail: "Auth error" });
  }
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});