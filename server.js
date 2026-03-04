// server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import languageRoutes from "./routes/language.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.set("trust proxy", 1);

// ---------------- Uploads directory ----------------
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/api/language", languageRoutes);

// ---------------- Auth middleware ----------------
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

const requireAuth = authMiddleware;

const requireRole = (...roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) return res.status(401).json({ error: "Unauthorized" });
  if (!roles.includes(role)) return res.status(403).json({ error: "Forbidden" });
  next();
};

// Admin can access everything.
// Manager can only access their own page id.
const requirePageAccessByIdParam = (paramName = "id") => (req, res, next) => {
  if (req.user?.role === "admin") return next();

  const requestedId = String(req.params?.[paramName] || "");
  const myPageId = String(req.user?.pageId || "");

  if (!requestedId || !myPageId) return res.status(403).json({ error: "Forbidden" });
  if (requestedId !== myPageId) return res.status(403).json({ error: "Forbidden" });

  next();
};

// ---------------- Multer upload ----------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype && file.mimetype.startsWith("image/");
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

const clampInt = (v, min, max) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
};

const UPLOAD_PRESETS = {
  hero: { maxWidth: 2560, quality: 86, effort: 4 },
  gallery: { maxWidth: 2200, quality: 84, effort: 4 },
  category: { maxWidth: 1600, quality: 84, effort: 4 },
  logo: { maxWidth: 1024, lossless: true, effort: 4 },
  default: { maxWidth: 2000, quality: 82, effort: 4 },
};

// Upload endpoint (admin + manager allowed)
app.post(
  "/api/uploads/image",
  requireAuth,
  requireRole("admin", "manager"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const kindRaw = String(req.body?.kind || "default").toLowerCase().trim();
      const preset = UPLOAD_PRESETS[kindRaw] || UPLOAD_PRESETS.default;

      const maxWidth = clampInt(req.body?.maxWidth, 320, 4096) ?? preset.maxWidth;
      const quality = clampInt(req.body?.quality, 40, 95) ?? preset.quality ?? 82;
      const effort = clampInt(req.body?.effort, 0, 6) ?? preset.effort ?? 4;

      const filename = `${randomUUID()}.webp`;
      const outPath = path.join(UPLOADS_DIR, filename);

      const pipeline = sharp(req.file.buffer, { failOn: "none" })
        .rotate()
        .resize({
          width: maxWidth,
          withoutEnlargement: true,
          fit: "inside",
        });

      const info = preset.lossless
        ? await pipeline.webp({ lossless: true, effort }).toFile(outPath)
        : await pipeline.webp({ quality, effort, smartSubsample: true }).toFile(outPath);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const url = `${baseUrl}/uploads/${filename}`;

      res.json({
        url,
        filename,
        kind: kindRaw,
        width: info?.width,
        height: info?.height,
        bytes: info?.size,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// ---------------- MongoDB connection ----------------
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URI);
console.log("Mongo connected");

// ---------------- Schemas ----------------
const SectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true },
    template: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const BlockSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    template: { type: String, default: "template1" },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    style: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const PageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    sections: { type: [SectionSchema], default: [] },
    active: { type: Boolean, default: true },
    visible: { type: Boolean, default: true },
    nav: { type: BlockSchema, default: null },
    footer: { type: BlockSchema, default: null },
    whatsapp: { type: BlockSchema, default: null },
    general: { type: mongoose.Schema.Types.Mixed, default: {} },
    limits: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ✅ NEW: single-editor lock (admin OR manager)
    editLock: {
      userId: { type: String, default: null },
      email: { type: String, default: "" },
      role: { type: String, default: "" }, // "admin" | "manager"
      startedAt: { type: Date, default: null },
      heartbeatAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true, collection: "pages" }
);

const Page = mongoose.model("Page", PageSchema);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager"], default: "manager" },
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page" },
  },
  { timestamps: true, collection: "users" }
);

const User = mongoose.model("User", UserSchema);

// ---------------- Helpers ----------------
const RESERVED_SLUGS = new Set([
  "",
  "home",
  "about",
  "contact",
  "booking",
  "portfolio",
  "sales",
  "bio",
  "modern",
  "payment",
  "admin",
  "admin-preview",
  "preview",
  "login",
  "logout",
]);

function normalizeSlug(slug) {
  return String(slug || "").trim().toLowerCase();
}

function isReservedSlug(slug) {
  const s = normalizeSlug(slug);
  if (!s) return true;
  if (RESERVED_SLUGS.has(s)) return true;
  if (s.startsWith("admin")) return true;
  return false;
}

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function toClientPage(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    name: obj.name,
    slug: obj.slug,
    sections: obj.sections || [],
    nav: obj.nav || null,
    footer: obj.footer || null,
    whatsapp: obj.whatsapp || null,
    active: typeof obj.active === "boolean" ? obj.active : true,
    visible: typeof obj.visible === "boolean" ? obj.visible : true,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    general: obj.general || {},
    limits: obj.limits || {},

    // (optional to return; not required on client)
    editLock: obj.editLock || null,
  };
}

function buildBlockUpdates(prefix, body) {
  const updates = {};
  if (typeof body.enabled !== "undefined") updates[`${prefix}.enabled`] = !!body.enabled;
  if (typeof body.template !== "undefined") updates[`${prefix}.template`] = String(body.template);

  const replaceConfig = body.replaceConfig === true;
  const replaceStyle = body.replaceStyle === true;

  if (replaceConfig) {
    updates[`${prefix}.config`] = isPlainObject(body.config) ? body.config : {};
  } else if (isPlainObject(body.config)) {
    for (const [k, v] of Object.entries(body.config)) {
      updates[`${prefix}.config.${k}`] = v;
    }
  }

  if (replaceStyle) {
    updates[`${prefix}.style`] = isPlainObject(body.style) ? body.style : {};
  } else if (isPlainObject(body.style)) {
    for (const [k, v] of Object.entries(body.style)) {
      updates[`${prefix}.style.${k}`] = v;
    }
  }

  return updates;
}

// ---------------- Auth routes ----------------

// manager login must include slug, and it must match the manager page slug
app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").toLowerCase().trim();
    const password = String(req.body?.password || "");
    const requestedSlug = normalizeSlug(req.body?.slug || req.body?.pageSlug || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // Managers MUST login from a business page slug and it MUST match their page (generic errors)
    if (user.role === "manager") {
      if (!requestedSlug) {
        return res.status(400).json({ error: "Login failed" });
      }

      if (!user.pageId) {
        return res.status(403).json({ error: "Login failed" });
      }

      const page = await Page.findById(user.pageId).select("slug").lean();
      if (!page) {
        return res.status(403).json({ error: "Login failed" });
      }

      const realSlug = normalizeSlug(page.slug);
      if (realSlug !== requestedSlug) {
        // ✅ IMPORTANT: do NOT reveal which page this manager belongs to
        return res.status(403).json({ error: "Login failed" });
      }
    }

    const token = jwt.sign(
      {
        id: String(user._id),
        email: user.email,
        role: user.role,
        pageId: user.pageId ? String(user.pageId) : null,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        pageId: user.pageId ? String(user.pageId) : null,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        id: String(user._id),
        email: user.email,
        role: user.role,
        pageId: user.pageId ? String(user.pageId) : null,
      },
    });
  } catch (err) {
    console.error("GET USER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Setup admin (admin only once)
app.post("/api/setup-admin", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) return res.status(400).json({ error: "Admin already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({
      email: String(email).toLowerCase(),
      password: hashed,
      role: "admin",
    });

    res.status(201).json({ message: "Admin created successfully", email: admin.email, role: admin.role });
  } catch (err) {
    console.error("SETUP ADMIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- Pages routes ----------------

// Admin list pages (admin only)
app.get("/api/pages", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const pages = await Page.find().sort({ updatedAt: -1 }).lean();
    res.json(pages.map((p) => toClientPage(p)));
  } catch (e) {
    console.error("ADMIN LIST PAGES ERROR:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Public list pages for homepage (only active + visible)
app.get("/api/pages-public", async (req, res) => {
  try {
    const pages = await Page.find({
      active: { $ne: false },
      visible: { $ne: false },
    })
      .select("_id name slug active visible createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(
      (pages || []).map((p) => ({
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        active: typeof p.active === "boolean" ? p.active : true,
        visible: typeof p.visible === "boolean" ? p.visible : true,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }))
    );
  } catch (e) {
    console.error("PUBLIC PAGES LIST ERROR:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Protected get by id (admin any, manager only own)
app.get("/api/pages/:id", requireAuth, requirePageAccessByIdParam("id"), async (req, res) => {
  try {
    const doc = await Page.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(toClientPage(doc));
  } catch {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Public get by slug for BusinessPage
app.get("/api/pages/slug/:slug", async (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  const doc = await Page.findOne({ slug });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(toClientPage(doc));
});

// ---------------- Edit Lock (single editor) ----------------
// ✅ This is the new feature that prevents admin+manager editing together.

const LOCK_TTL_MS = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_EVERY_MS = 25 * 1000;

function cleanLock(lock) {
  if (!lock) return null;
  return {
    email: lock.email || "",
    role: lock.role || "",
    startedAt: lock.startedAt || null,
    expiresAt: lock.expiresAt || null,
  };
}

function buildLockForUser(req) {
  const now = new Date();
  return {
    userId: String(req.user.id),
    email: String(req.user.email || ""),
    role: String(req.user.role || ""),
    startedAt: now,
    heartbeatAt: now,
    expiresAt: new Date(Date.now() + LOCK_TTL_MS),
  };
}

function emptyLock() {
  return {
    userId: null,
    email: "",
    role: "",
    startedAt: null,
    heartbeatAt: null,
    expiresAt: null,
  };
}

// Acquire lock (atomic)
app.post(
  "/api/pages/:id/edit-lock/acquire",
  requireAuth,
  requirePageAccessByIdParam("id"),
  async (req, res) => {
    try {
      const pageId = req.params.id;
      const now = new Date();
      const myUserId = String(req.user.id);

      const updated = await Page.findOneAndUpdate(
        {
          _id: pageId,
          $or: [
            { editLock: null },
            { "editLock.userId": null },
            { "editLock.expiresAt": { $lte: now } },
            { "editLock.userId": myUserId },
          ],
        },
        { $set: { editLock: buildLockForUser(req) } },
        { new: true }
      ).lean();

      if (!updated) {
        const existing = await Page.findById(pageId).select("editLock").lean();
        return res.status(423).json({
          error: "Page is locked",
          locked: true,
          lock: cleanLock(existing?.editLock),
        });
      }

      return res.json({
        ok: true,
        locked: false,
        lock: cleanLock(updated.editLock),
        heartbeatEveryMs: HEARTBEAT_EVERY_MS,
      });
    } catch (e) {
      console.error("ACQUIRE LOCK ERROR:", e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Heartbeat (extend TTL)
app.post(
  "/api/pages/:id/edit-lock/heartbeat",
  requireAuth,
  requirePageAccessByIdParam("id"),
  async (req, res) => {
    try {
      const pageId = req.params.id;
      const now = new Date();
      const myUserId = String(req.user.id);

      const updated = await Page.findOneAndUpdate(
        {
          _id: pageId,
          "editLock.userId": myUserId,
          "editLock.expiresAt": { $gt: now },
        },
        {
          $set: {
            "editLock.heartbeatAt": now,
            "editLock.expiresAt": new Date(Date.now() + LOCK_TTL_MS),
          },
        },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(409).json({ error: "Lock lost" });
      }

      return res.json({
        ok: true,
        expiresAt: updated.editLock?.expiresAt || null,
        heartbeatEveryMs: HEARTBEAT_EVERY_MS,
      });
    } catch (e) {
      console.error("HEARTBEAT ERROR:", e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Release lock
app.post(
  "/api/pages/:id/edit-lock/release",
  requireAuth,
  requirePageAccessByIdParam("id"),
  async (req, res) => {
    try {
      const pageId = req.params.id;
      const myUserId = String(req.user.id);

      await Page.findOneAndUpdate(
        { _id: pageId, "editLock.userId": myUserId },
        { $set: { editLock: emptyLock() } },
        { new: true }
      ).lean();

      return res.json({ ok: true });
    } catch (e) {
      console.error("RELEASE LOCK ERROR:", e);
      res.status(500).json({ error: "Server error" });
    }
  }
);
// ✅ Admin-only: force take over the edit lock (kicks current editor)
app.post(
  "/api/pages/:id/edit-lock/force",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const pageId = req.params.id;

      const updated = await Page.findByIdAndUpdate(
        pageId,
        { $set: { editLock: buildLockForUser(req) } }, // overwrite lock no matter what
        { new: true }
      ).lean();

      if (!updated) return res.status(404).json({ error: "Not found" });

      return res.json({
        ok: true,
        lock: cleanLock(updated.editLock),
        heartbeatEveryMs: HEARTBEAT_EVERY_MS,
      });
    } catch (e) {
      console.error("FORCE LOCK ERROR:", e);
      res.status(500).json({ error: "Server error" });
    }
  }
);
// Sections patch (admin any, manager only own)
app.patch(
  "/api/pages/:id/sections/:sectionId",
  requireAuth,
  requirePageAccessByIdParam("id"),
  async (req, res) => {
    try {
      const { id, sectionId } = req.params;

      const updates = {};
      if (typeof req.body.enabled !== "undefined") updates["sections.$.enabled"] = !!req.body.enabled;
      if (typeof req.body.template !== "undefined") updates["sections.$.template"] = String(req.body.template);

      const replaceConfig = req.body.replaceConfig === true;
      const replaceStyle = req.body.replaceStyle === true;

      if (replaceConfig) {
        updates["sections.$.config"] = isPlainObject(req.body.config) ? req.body.config : {};
      } else if (isPlainObject(req.body.config)) {
        for (const [k, v] of Object.entries(req.body.config)) {
          updates[`sections.$.config.${k}`] = v;
        }
      }

      if (replaceStyle) {
        updates["sections.$.style"] = isPlainObject(req.body.style) ? req.body.style : {};
      } else if (isPlainObject(req.body.style)) {
        for (const [k, v] of Object.entries(req.body.style)) {
          updates[`sections.$.style.${k}`] = v;
        }
      }

      if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No updates provided" });

      const doc = await Page.findOneAndUpdate({ _id: id, "sections.id": sectionId }, { $set: updates }, { new: true });
      if (!doc) return res.status(404).json({ error: "Not found" });

      const updatedSection = (doc.sections || []).find((s) => s.id === sectionId);
      res.json({ section: updatedSection, updatedAt: doc.updatedAt });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Status only admin
app.patch("/api/pages/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.active !== "undefined") updates.active = !!req.body.active;
    if (typeof req.body.visible !== "undefined") updates.visible = !!req.body.visible;

    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No updates provided" });

    const doc = await Page.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });

    res.json(toClientPage(doc));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Nav patch (admin any, manager only own)
app.patch("/api/pages/:id/nav", requireAuth, requirePageAccessByIdParam("id"), async (req, res) => {
  try {
    const updates = buildBlockUpdates("nav", req.body || {});
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No updates provided" });

    const doc = await Page.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });

    res.json({ nav: doc.nav || null, updatedAt: doc.updatedAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Footer patch (admin any, manager only own)
app.patch("/api/pages/:id/footer", requireAuth, requirePageAccessByIdParam("id"), async (req, res) => {
  try {
    const updates = buildBlockUpdates("footer", req.body || {});
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No updates provided" });

    const doc = await Page.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!doc) return res.status(404).json({ error: "Not found" });

    res.json({ footer: doc.footer || null, updatedAt: doc.updatedAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Create manager user for a page (admin only)
app.post("/api/pages/:pageId/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { email, password } = req.body;
    const { pageId } = req.params;

    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const page = await Page.findById(pageId);
    if (!page) return res.status(404).json({ error: "Page not found" });

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: String(email).toLowerCase(),
      password: hashed,
      role: "manager",
      pageId,
    });

    res.status(201).json({
      id: String(user._id),
      email: user.email,
      role: user.role,
      pageId: String(user.pageId),
      message: "Manager created successfully",
    });
  } catch (e) {
    console.error("CREATE USER ERROR:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// List managers (admin only)
app.get("/api/pages/:pageId/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { pageId } = req.params;

    const page = await Page.findById(pageId).lean();
    if (!page) return res.status(404).json({ error: "Page not found" });

    const users = await User.find({ pageId, role: "manager" })
      .select("_id email role pageId createdAt updatedAt")
      .lean();

    res.json(
      users.map((u) => ({
        id: String(u._id),
        email: u.email,
        role: u.role,
        pageId: String(u.pageId),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }))
    );
  } catch (e) {
    console.error("LIST USERS ERROR:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Change manager password (admin only)
app.patch("/api/pages/:pageId/users/:userId/password", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { pageId, userId } = req.params;
    const password = String(req.body?.password || "");

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ _id: userId, pageId, role: "manager" });
    if (!user) return res.status(404).json({ error: "Manager not found" });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();

    res.json({ ok: true, message: "Password updated" });
  } catch (e) {
    console.error("CHANGE MANAGER PASSWORD ERROR:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete manager (admin only)
app.delete("/api/pages/:pageId/users/:userId", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { pageId, userId } = req.params;

    const user = await User.findOne({ _id: userId, pageId, role: "manager" });
    if (!user) return res.status(404).json({ error: "Manager not found" });

    await User.deleteOne({ _id: userId });
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE USER ERROR:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// Create page (admin only)
app.post("/api/pages", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim() || "Untitled";
    const slug = normalizeSlug(req.body?.slug);

    if (!slug) return res.status(400).json({ error: "Slug is required" });
    if (isReservedSlug(slug)) return res.status(400).json({ error: "Slug is reserved" });

    const sections = Array.isArray(req.body?.sections) ? req.body.sections : [];
    const nav = req.body?.nav && typeof req.body.nav === "object" ? req.body.nav : null;
    const footer = req.body?.footer && typeof req.body.footer === "object" ? req.body.footer : null;
    const whatsapp = req.body?.whatsapp && typeof req.body.whatsapp === "object" ? req.body.whatsapp : null;
    const active = typeof req.body?.active === "boolean" ? req.body.active : true;
    const visible = typeof req.body?.visible === "boolean" ? req.body.visible : true;

    const general = isPlainObject(req.body?.general) ? req.body.general : {};
    const limits = isPlainObject(req.body?.limits) ? req.body.limits : {};

    const doc = await Page.create({
      name,
      slug,
      sections,
      nav,
      footer,
      whatsapp,
      active,
      visible,
      general,
      limits,
      editLock: emptyLock(),
    });

    res.status(201).json(toClientPage(doc));
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "Slug already exists" });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Update page
// Admin can update everything.
// Manager can update ONLY: sections, nav, footer, whatsapp, general (no slug, no limits, no active/visible)
app.put("/api/pages/:id", requireAuth, requirePageAccessByIdParam("id"), async (req, res) => {
  try {
    const id = req.params.id;

    const isAdmin = req.user?.role === "admin";
    const updateDoc = {};

    if (isAdmin) {
      const name = String(req.body?.name || "").trim() || "Untitled";
      const slug = normalizeSlug(req.body?.slug);

      if (!slug) return res.status(400).json({ error: "Slug is required" });
      if (isReservedSlug(slug)) return res.status(400).json({ error: "Slug is reserved" });

      updateDoc.name = name;
      updateDoc.slug = slug;

      if (typeof req.body?.limits !== "undefined") {
        updateDoc.limits = isPlainObject(req.body.limits) ? req.body.limits : {};
      }
    }

    if (typeof req.body?.sections !== "undefined") {
      updateDoc.sections = Array.isArray(req.body.sections) ? req.body.sections : [];
    }
    if (typeof req.body?.nav !== "undefined") {
      updateDoc.nav = req.body?.nav && typeof req.body.nav === "object" ? req.body.nav : null;
    }
    if (typeof req.body?.footer !== "undefined") {
      updateDoc.footer = req.body?.footer && typeof req.body.footer === "object" ? req.body.footer : null;
    }
    if (typeof req.body?.whatsapp !== "undefined") {
      updateDoc.whatsapp = req.body?.whatsapp && typeof req.body.whatsapp === "object" ? req.body.whatsapp : null;
    }
    if (typeof req.body?.general !== "undefined") {
      updateDoc.general = isPlainObject(req.body.general) ? req.body.general : {};
    }

    const updated = await Page.findByIdAndUpdate(id, updateDoc, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(toClientPage(updated));
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: "Slug already exists" });
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete page (admin only)
app.delete("/api/pages/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const deleted = await Page.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => console.log("API running on port", PORT));