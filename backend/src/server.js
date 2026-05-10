import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { WebSocketServer } from "ws";
import { createSeedData } from "./seed.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, "../data/local-db.json");
const sessionCookieName = "healthsync_session";
const port = process.env.PORT || 5000;

const app = express();


// ===================== FIXED CORS (IMPORTANT) =====================
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://hospito-8j3on4o6d-tapan-patidar-s-projects.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

const pharmacySockets = new Map();

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => {
        const index = item.indexOf("=");
        const key = index >= 0 ? item.slice(0, index) : item;
        const value = index >= 0 ? item.slice(index + 1) : "";
        return [key, decodeURIComponent(value)];
      })
  );
}

function sanitizeUser(user) {
  const { passwordHash, password, ...safeUser } = user;
  return safeUser;
}

// ===================== COOKIE FIX (IMPORTANT) =====================
function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=None; Secure`
  );
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${sessionCookieName}=; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=0`
  );
}

async function ensureDb() {
  await fs.mkdir(path.dirname(dbFile), { recursive: true });

  try {
    await fs.access(dbFile);
  } catch {
    const seed = createSeedData();
    seed.users = await Promise.all(
      seed.users.map(async user => ({
        ...user,
        passwordHash: await bcrypt.hash(user.password, 10)
      }))
    );
    await fs.writeFile(dbFile, JSON.stringify(seed, null, 2));
  }
}

async function readDb() {
  await ensureDb();
  return JSON.parse(await fs.readFile(dbFile, "utf8"));
}

async function writeDb(data) {
  await fs.writeFile(dbFile, JSON.stringify(data, null, 2));
}

function roleGuard(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ detail: "Access denied" });
    }
    next();
  };
}

async function auth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[sessionCookieName];

  if (!token) {
    return res.status(401).json({ detail: "No session" });
  }

  const db = await readDb();
  const session = db.sessions.find(s => s.token === token);

  if (!session) {
    return res.status(401).json({ detail: "Invalid session" });
  }

  const user = db.users.find(u => u.id === session.userId);

  if (!user) {
    return res.status(401).json({ detail: "User not found" });
  }

  req.db = db;
  req.user = user;
  req.session = session;
  next();
}

// ===================== ROUTES =====================

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const db = await readDb();

  const email = req.body.email?.toLowerCase();
  const password = req.body.password;

  const user = db.users.find(u => u.email.toLowerCase() === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ detail: "Invalid credentials" });
  }

  const token = randomUUID();

  db.sessions = db.sessions.filter(s => s.userId !== user.id);
  db.sessions.push({ userId: user.id, token });

  await writeDb(db);
  setSessionCookie(res, token);

  res.json({ user: sanitizeUser(user) });
});

app.post("/api/auth/register", async (req, res) => {
  const db = await readDb();

  const email = req.body.email?.toLowerCase();

  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ detail: "User exists" });
  }

  const user = {
    id: randomUUID(),
    email,
    name: req.body.name,
    role: req.body.role,
    passwordHash: await bcrypt.hash(req.body.password, 10)
  };

  db.users.push(user);
  await writeDb(db);

  res.status(201).json({ user: sanitizeUser(user) });
});

app.post("/api/auth/logout", auth, async (req, res) => {
  req.db.sessions = req.db.sessions.filter(s => s.token !== req.session.token);
  await writeDb(req.db);
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", auth, async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

// ===================== SERVER START =====================

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});