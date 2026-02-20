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

// Dev-friendly CORS (restrict later if you want)
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.set("trust proxy", 1);

// -------------------- Uploads --------------------
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve uploaded files publicly
app.use("/uploads", express.static(UPLOADS_DIR));

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype && file.mimetype.startsWith("image/");
    cb(ok ? null : new Error("Only image files are allowed"), ok);
  },
});

app.post("/api/uploads/image", upload.single("file"), async (req, res) => {
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
});

// -------------------- Mongo --------------------
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
console.log("Mongo connected");

// -------------------- Models --------------------

// Language (your existing idea)
const LanguageSchema = new mongoose.Schema(
  { _id: String },
  { strict: false, collection: "language" }
);
const Language = mongoose.model("Language", LanguageSchema);

// Pages
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

// ✅ NEW: nav/footer reusable schema
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
    // ✅ NEW:
    nav: { type: BlockSchema, default: null },
    footer: { type: BlockSchema, default: null },
    whatsapp: { type: BlockSchema, default: null },


  },
  { timestamps: true, collection: "pages" }
);

const Page = mongoose.model("Page", PageSchema);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true }, // hashed password
    role: { type: String, enum: ["admin", "manager"], default: "manager" },
    pageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page" },
  },
  { timestamps: true, collection: "users" }
);

const User = mongoose.model("User", UserSchema);

// -------------------- Helpers --------------------
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

function toClientPage(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    name: obj.name,
    slug: obj.slug,
    sections: obj.sections || [],

    // include nav/footer so client can render real DB values
    nav: obj.nav || null,
    footer: obj.footer || null,
    whatsapp: obj.whatsapp || null,   // ✅ ADD THIS

    active: typeof obj.active === "boolean" ? obj.active : true,
    visible: typeof obj.visible === "boolean" ? obj.visible : true,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
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

// -------------------- Language Routes --------------------
app.get("/api/seed-language", async (req, res) => {
  const doc = await Language.create({
    _id: "en",
    homepage: {
      hero: {
        title: "Create Beautiful Business Pages",
        subtitle: "Fast and modern",
      },
    },
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

// -------------------- Pages Routes --------------------

// List pages
app.get("/api/pages", async (req, res) => {
  const pages = await Page.find().sort({ updatedAt: -1 }).lean();
  res.json(
    pages.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      sections: p.sections || [],
      nav: p.nav || null,
      footer: p.footer || null,
      active: typeof p.active === "boolean" ? p.active : true,
      visible: typeof p.visible === "boolean" ? p.visible : true,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  );
});

// Get page by id
app.get("/api/pages/:id", async (req, res) => {
  try {
    const doc = await Page.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(toClientPage(doc));
  } catch (e) {
    return res.status(400).json({ error: "Invalid id" });
  }
});

// Get page by slug
app.get("/api/pages/slug/:slug", async (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  const doc = await Page.findOne({ slug });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(toClientPage(doc));
});

// Update ONE section (partial OR replace) by sectionId
app.patch("/api/pages/:id/sections/:sectionId", async (req, res) => {
  try {
    const { id, sectionId } = req.params;

    const updates = {};

    if (typeof req.body.enabled !== "undefined") {
      updates["sections.$.enabled"] = !!req.body.enabled;
    }
    if (typeof req.body.template !== "undefined") {
      updates["sections.$.template"] = String(req.body.template);
    }

    const replaceConfig = req.body.replaceConfig === true;
    const replaceStyle = req.body.replaceStyle === true;

    if (replaceConfig) {
      const nextCfg = isPlainObject(req.body.config) ? req.body.config : {};
      updates["sections.$.config"] = nextCfg;
    } else if (isPlainObject(req.body.config)) {
      for (const [k, v] of Object.entries(req.body.config)) {
        updates[`sections.$.config.${k}`] = v;
      }
    }

    if (replaceStyle) {
      const nextStyle = isPlainObject(req.body.style) ? req.body.style : {};
      updates["sections.$.style"] = nextStyle;
    } else if (isPlainObject(req.body.style)) {
      for (const [k, v] of Object.entries(req.body.style)) {
        updates[`sections.$.style.${k}`] = v;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    const doc = await Page.findOneAndUpdate(
      { _id: id, "sections.id": sectionId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!doc) return res.status(404).json({ error: "Not found" });

    const updatedSection = (doc.sections || []).find((s) => s.id === sectionId);
    res.json({ section: updatedSection, updatedAt: doc.updatedAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});
app.patch("/api/pages/:id/status", async (req, res) => {
  try {
    const updates = {};
    if (typeof req.body.active !== "undefined") updates.active = !!req.body.active;
    if (typeof req.body.visible !== "undefined") updates.visible = !!req.body.visible;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    const doc = await Page.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(toClientPage(doc));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

//  PATCH nav (autosave)
app.patch("/api/pages/:id/nav", async (req, res) => {
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

// PATCH footer (autosave optional)
app.patch("/api/pages/:id/footer", async (req, res) => {
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

// create user
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        pageId: user.pageId,
      },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//add manager to page
app.post("/api/pages/:pageId/users", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { pageId } = req.params;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashed,
      role: "manager",
      pageId,
    });

    res.status(201).json({
      id: user._id,
      email: user.email,
      role: user.role,
      pageId: user.pageId,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Create page
app.post("/api/pages", async (req, res) => {
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

    const doc = await Page.create({
      name,
      slug,
      sections,
      nav,
      footer,
      whatsapp,
      active,
      visible,
    });

    res.status(201).json(toClientPage(doc));
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Slug already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Update page (full save)
app.put("/api/pages/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const name = String(req.body?.name || "").trim() || "Untitled";
    const slug = normalizeSlug(req.body?.slug);

    if (!slug) return res.status(400).json({ error: "Slug is required" });
    if (isReservedSlug(slug)) return res.status(400).json({ error: "Slug is reserved" });

    const sections = Array.isArray(req.body?.sections) ? req.body.sections : [];
    const nav = req.body?.nav && typeof req.body.nav === "object" ? req.body.nav : null;
    const footer = req.body?.footer && typeof req.body.footer === "object" ? req.body.footer : null;
    const whatsapp = req.body?.whatsapp && typeof req.body.whatsapp === "object"
      ? req.body.whatsapp
      : null;   // ✅ ADD THIS

    const updated = await Page.findByIdAndUpdate(
      id,
      { name, slug, sections, nav, footer, whatsapp },   // ✅ ADD HERE
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(toClientPage(updated));
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Slug already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/pages/:pageId", authMiddleware, async (req, res) => {
  const { pageId } = req.params;

  if (req.user.role === "manager" && req.user.pageId !== pageId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // continue update
});

// Delete page
app.delete("/api/pages/:id", async (req, res) => {
  try {
    const deleted = await Page.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: "Invalid id" });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log("API running on port", PORT);
});
