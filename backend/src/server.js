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
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
app.use(cors({ origin: clientUrl, credentials: true }));
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

function setSessionCookie(res, token) {
  res.cookie?.(sessionCookieName, token);
  res.setHeader("Set-Cookie", `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}

async function ensureDb() {
  await fs.mkdir(path.dirname(dbFile), { recursive: true });

  try {
    await fs.access(dbFile);
    const current = JSON.parse(await fs.readFile(dbFile, "utf8"));
    const isLegacy = !Array.isArray(current.prescriptions) || !current.users?.some(user => ["patient", "doctor", "pharmacist"].includes(user.role));

    if (!isLegacy) return;
  } catch {
    // Seed below.
  }

  const seed = createSeedData();
  seed.users = await Promise.all(seed.users.map(async user => ({
    ...user,
    passwordHash: await bcrypt.hash(user.password, 10)
  })));
  await fs.writeFile(dbFile, JSON.stringify(seed, null, 2));
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
      return res.status(403).json({ detail: `Access restricted to: ${roles.join(", ")}` });
    }
    return next();
  };
}

async function auth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[sessionCookieName];

  if (!token) {
    return res.status(401).json({ detail: "Authentication required" });
  }

  const db = await readDb();
  const session = db.sessions.find(item => item.token === token);

  if (!session) {
    clearSessionCookie(res);
    return res.status(401).json({ detail: "Invalid session" });
  }

  const user = db.users.find(item => item.id === session.userId);

  if (!user) {
    clearSessionCookie(res);
    return res.status(401).json({ detail: "User not found" });
  }

  req.db = db;
  req.user = user;
  req.session = session;
  return next();
}

function getPatientWithPrescriptions(db, patientId) {
  const user = db.users.find(item => item.id === patientId && item.role === "patient");
  if (!user) return null;
  return {
    ...sanitizeUser(user),
    prescriptions: db.prescriptions.filter(item => item.patient_id === patientId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  };
}

function broadcastToPharmacy(pharmacyId, payload) {
  const sockets = pharmacySockets.get(pharmacyId) || new Set();
  const message = JSON.stringify(payload);

  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  }
}

app.get("/api/health", async (_req, res) => {
  await ensureDb();
  res.json({ ok: true });
});

app.post("/api/auth/login", async (req, res) => {
  const db = await readDb();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.users.find(item => item.email.toLowerCase() === email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ detail: "Invalid email or password" });
  }

  const token = randomUUID();
  db.sessions = db.sessions.filter(item => item.userId !== user.id);
  db.sessions.push({ id: randomUUID(), userId: user.id, token, created_at: new Date().toISOString() });
  await writeDb(db);
  setSessionCookie(res, token);

  return res.json({ user: sanitizeUser(user), message: "Login successful" });
});

app.post("/api/auth/register", async (req, res) => {
  const db = await readDb();
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!email || !req.body.password || !req.body.name || !req.body.role) {
    return res.status(400).json({ detail: "Name, email, password, and role are required" });
  }

  if (db.users.some(item => item.email.toLowerCase() === email)) {
    return res.status(400).json({ detail: "An account with this email already exists" });
  }

  const role = req.body.role;
  const baseUser = {
    id: randomUUID(),
    email,
    name: req.body.name,
    role,
    phone: req.body.phone || "",
    created_at: new Date().toISOString(),
    passwordHash: await bcrypt.hash(String(req.body.password), 10)
  };

  let user = baseUser;
  if (role === "patient") {
    user = {
      ...baseUser,
      date_of_birth: req.body.date_of_birth || "",
      blood_type: req.body.blood_type || "",
      medical_history: [],
      allergies: []
    };
  } else if (role === "doctor") {
    user = {
      ...baseUser,
      specialization: req.body.specialization || "",
      license_number: req.body.license_number || ""
    };
  } else if (role === "pharmacist") {
    user = {
      ...baseUser,
      pharmacy_name: req.body.pharmacy_name || "",
      license_number: req.body.license_number || ""
    };
  } else {
    return res.status(400).json({ detail: "Unsupported role" });
  }

  db.users.push(user);
  const token = randomUUID();
  db.sessions.push({ id: randomUUID(), userId: user.id, token, created_at: new Date().toISOString() });
  await writeDb(db);
  setSessionCookie(res, token);

  return res.status(201).json({ user: sanitizeUser(user), message: "Registration successful" });
});

app.post("/api/auth/logout", auth, async (req, res) => {
  req.db.sessions = req.db.sessions.filter(item => item.token !== req.session.token);
  await writeDb(req.db);
  clearSessionCookie(res);
  return res.json({ message: "Logout successful" });
});

app.get("/api/auth/me", auth, async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

app.get("/api/patients", auth, roleGuard("doctor"), async (req, res) => {
  const query = String(req.query.q || "").trim().toLowerCase();
  const patients = req.db.users
    .filter(item => item.role === "patient")
    .filter(item => !query || item.name.toLowerCase().includes(query) || item.email.toLowerCase().includes(query))
    .map(item => sanitizeUser(item));

  return res.json({ patients });
});

app.get("/api/patients/:id", auth, async (req, res) => {
  if (req.user.role !== "doctor" && req.user.id !== req.params.id) {
    return res.status(403).json({ detail: "Access restricted to: doctor, patient owner" });
  }

  const patient = getPatientWithPrescriptions(req.db, req.params.id);
  if (!patient) return res.status(404).json({ detail: "Patient not found" });
  return res.json({ patient });
});

app.get("/api/patients/:id/prescriptions", auth, async (req, res) => {
  if (req.user.role === "patient" && req.user.id !== req.params.id) {
    return res.status(403).json({ detail: "Access restricted to this patient" });
  }

  const prescriptions = req.db.prescriptions
    .filter(item => item.patient_id === req.params.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return res.json({ prescriptions });
});

app.post("/api/patients/:id/prescriptions", auth, roleGuard("doctor"), async (req, res) => {
  const patient = req.db.users.find(item => item.id === req.params.id && item.role === "patient");
  const pharmacy = req.db.users.find(item => item.id === req.body.pharmacy_id && item.role === "pharmacist");

  if (!patient) return res.status(404).json({ detail: "Patient not found" });
  if (!pharmacy) return res.status(404).json({ detail: "Pharmacy not found" });

  const now = new Date().toISOString();
  const prescription = {
    id: randomUUID(),
    patient_id: patient.id,
    pharmacy_id: pharmacy.id,
    prescriber_id: req.user.id,
    prescriber_name: req.user.name,
    patient_name: patient.name,
    pharmacy_name: pharmacy.pharmacy_name || pharmacy.name,
    medication_name: req.body.medication_name,
    dosage: req.body.dosage,
    frequency: req.body.frequency,
    duration: req.body.duration,
    notes: req.body.notes || "",
    diagnosis: req.body.diagnosis || "",
    status: "pending",
    created_at: now,
    updated_at: now
  };

  req.db.prescriptions.push(prescription);
  const notification = {
    id: randomUUID(),
    pharmacy_id: pharmacy.id,
    prescription_id: prescription.id,
    type: "new_prescription",
    medication_name: prescription.medication_name,
    patient_name: prescription.patient_name,
    prescriber_name: prescription.prescriber_name,
    created_at: now,
    read: false
  };
  req.db.notifications.push(notification);
  await writeDb(req.db);
  broadcastToPharmacy(pharmacy.id, { ...notification, ...prescription });

  return res.status(201).json({ prescription });
});

app.get("/api/pharmacies", auth, roleGuard("doctor"), async (req, res) => {
  const pharmacies = req.db.users
    .filter(item => item.role === "pharmacist")
    .map(item => sanitizeUser(item));

  return res.json({ pharmacies });
});

app.get("/api/pharmacies/:id/prescriptions", auth, async (req, res) => {
  if (req.user.role !== "pharmacist" || req.user.id !== req.params.id) {
    return res.status(403).json({ detail: "Access restricted to: pharmacist owner" });
  }

  const prescriptions = req.db.prescriptions
    .filter(item => item.pharmacy_id === req.params.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return res.json({ prescriptions });
});

app.put("/api/pharmacies/:id/prescriptions/:prescriptionId/status", auth, async (req, res) => {
  if (req.user.role !== "pharmacist" || req.user.id !== req.params.id) {
    return res.status(403).json({ detail: "Access restricted to: pharmacist owner" });
  }

  const prescription = req.db.prescriptions.find(item => item.id === req.params.prescriptionId && item.pharmacy_id === req.params.id);
  if (!prescription) return res.status(404).json({ detail: "Prescription not found" });

  prescription.status = req.body.status;
  prescription.updated_at = new Date().toISOString();
  await writeDb(req.db);
  return res.json({ prescription });
});

app.get("/api/stats/doctor", auth, roleGuard("doctor"), async (req, res) => {
  const totalPatients = req.db.users.filter(item => item.role === "patient").length;
  const mine = req.db.prescriptions.filter(item => item.prescriber_id === req.user.id);
  const today = new Date().toISOString().slice(0, 10);

  return res.json({
    total_patients: totalPatients,
    total_prescriptions: mine.length,
    today_prescriptions: mine.filter(item => item.created_at.slice(0, 10) === today).length
  });
});

app.get("/api/stats/pharmacist", auth, roleGuard("pharmacist"), async (req, res) => {
  const mine = req.db.prescriptions.filter(item => item.pharmacy_id === req.user.id);
  const unread = req.db.notifications.filter(item => item.pharmacy_id === req.user.id && !item.read).length;

  return res.json({
    total_prescriptions: mine.length,
    pending: mine.filter(item => item.status === "pending").length,
    fulfilled: mine.filter(item => item.status === "fulfilled").length,
    unread_notifications: unread
  });
});

async function start() {
  await ensureDb();
  const server = app.listen(port, () => {
    console.log(`HealthSync backend running on http://localhost:${port}`);
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on("connection", (socket, request, pharmacyId) => {
    const existing = pharmacySockets.get(pharmacyId) || new Set();
    existing.add(socket);
    pharmacySockets.set(pharmacyId, existing);

    socket.on("message", message => {
      if (String(message) === "ping") {
        socket.send("pong");
      }
    });

    socket.on("close", () => {
      const sockets = pharmacySockets.get(pharmacyId);
      if (!sockets) return;
      sockets.delete(socket);
      if (!sockets.size) pharmacySockets.delete(pharmacyId);
    });
  });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const match = url.pathname.match(/^\/ws\/pharmacy\/([^/]+)$/);

    if (!match) {
      socket.destroy();
      return;
    }

    const pharmacyId = decodeURIComponent(match[1]);
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit("connection", ws, request, pharmacyId);
    });
  });
}

start().catch(error => {
  console.error("Failed to start server", error);
  process.exit(1);
});
