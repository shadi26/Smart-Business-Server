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

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.set("trust proxy", 1);

// ---------------- Uploads directory ----------------
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOADS_DIR));

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

const requirePageAccessByPageIdParam = (paramName = "pageId") => (req, res, next) => {
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

// Upload endpoint (admin + manager allowed)
app.post(
  "/api/uploads/image",
  requireAuth,
  requireRole("admin", "manager"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const filename = `${randomUUID()}.webp`;
      const outPath = path.join(UPLOADS_DIR, filename);

      await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 2000, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(outPath);

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const url = `${baseUrl}/uploads/${filename}`;

      res.json({ url, filename });
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

// ---------------- Models ----------------
const LanguageSchema = new mongoose.Schema({ _id: String }, { strict: false, collection: "language" });
const Language = mongoose.model("Language", LanguageSchema);

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

// ---------------- Language routes (public) ----------------
app.get("/api/seed-language", async (req, res) => {
  const doc = await Language.create({
    _id: "en",
    homepage: { hero: { title: "Create Beautiful Business Pages", subtitle: "Fast and modern" } },
  });
  res.json({ ok: true, created: doc._id });
});

app.get("/api/language/:lang", async (req, res) => {
  const lang = req.params.lang;
  const doc = await Language.findById(lang).lean();
  if (!doc) return res.status(404).json({ error: "Not found" });
  delete doc.__v;
  res.json(doc);
});

// ---------------- Auth routes ----------------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

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

// Admin list pages only
app.get("/api/pages", requireAuth, requireRole("admin"), async (req, res) => {
  const pages = await Page.find().sort({ updatedAt: -1 }).lean();
  res.json(pages.map((p) => toClientPage(p)));
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
app.post(
  "/api/pages/:pageId/users",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
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
  }
);

// List managers (admin only)
app.get(
  "/api/pages/:pageId/users",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
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
  }
);

// Delete manager (admin only)
app.delete(
  "/api/pages/:pageId/users/:userId",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
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
  }
);

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
app.put(
  "/api/pages/:id",
  requireAuth,
  requirePageAccessByIdParam("id"),
  async (req, res) => {
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

      // both admin + manager allowed
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
  }
);

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