import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import multer from "multer";
import sharp from "sharp";

dotenv.config();

const app = express();

// Dev-friendly CORS (you can restrict later)
app.use(cors());
app.use(express.json());
app.set("trust proxy", 1);

// Create uploads folder
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve uploaded files publicly
app.use("/uploads", express.static(UPLOADS_DIR));

// ---------- Mongo ----------
await mongoose.connect(process.env.MONGODB_URI);
console.log("Mongo connected");

// ---------- Models ----------
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

    // Convert to webp (smaller + faster)
    const filename = `${crypto.randomUUID()}.webp`;
    const outPath = path.join(UPLOADS_DIR, filename);

    await sharp(req.file.buffer)
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true }) // optional safety
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

const PageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    sections: { type: [SectionSchema], default: [] },
  },
  { timestamps: true, collection: "pages" }
);

const Page = mongoose.model("Page", PageSchema);

// ---------- Helpers ----------
const RESERVED_SLUGS = new Set([
  "",
  "home", "about", "contact", "booking", "portfolio", "sales", "bio", "modern", "payment",
  "admin", "admin-preview", "preview",
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
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

// ---------- Language Routes ----------
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

// ---------- Pages Routes ----------

// List pages
app.get("/api/pages", async (req, res) => {
  const pages = await Page.find().sort({ updatedAt: -1 }).lean();
  res.json(
    pages.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      sections: p.sections || [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  );
});

// Get page by id
app.get("/api/pages/:id", async (req, res) => {
  const doc = await Page.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(toClientPage(doc));
});

// Get page by slug
app.get("/api/pages/slug/:slug", async (req, res) => {
  const slug = normalizeSlug(req.params.slug);
  const doc = await Page.findOne({ slug });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(toClientPage(doc));
});
// Update ONE section (partial) by sectionId
app.patch("/api/pages/:id/sections/:sectionId", async (req, res) => {
  try {
    const { id, sectionId } = req.params;

    const updates = {};

    // Optional: allow enabled/template updates
    if (typeof req.body.enabled !== "undefined") {
      updates["sections.$.enabled"] = !!req.body.enabled;
    }
    if (typeof req.body.template !== "undefined") {
      updates["sections.$.template"] = String(req.body.template);
    }

    // Partial config updates
    if (req.body.config && typeof req.body.config === "object") {
      for (const [k, v] of Object.entries(req.body.config)) {
        updates[`sections.$.config.${k}`] = v;
      }
    }

    // Partial style updates
    if (req.body.style && typeof req.body.style === "object") {
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

// Create page
app.post("/api/pages", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim() || "Untitled";
    const slug = normalizeSlug(req.body?.slug);

    if (!slug) return res.status(400).json({ error: "Slug is required" });
    if (isReservedSlug(slug)) return res.status(400).json({ error: "Slug is reserved" });

    const sections = Array.isArray(req.body?.sections) ? req.body.sections : [];

    const doc = await Page.create({
      name,
      slug,
      sections,
    });

    res.status(201).json(toClientPage(doc));
  } catch (e) {
    // duplicate slug
    if (e?.code === 11000) {
      return res.status(409).json({ error: "Slug already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

// Update page
app.put("/api/pages/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const name = String(req.body?.name || "").trim() || "Untitled";
    const slug = normalizeSlug(req.body?.slug);

    if (!slug) return res.status(400).json({ error: "Slug is required" });
    if (isReservedSlug(slug)) return res.status(400).json({ error: "Slug is reserved" });

    const sections = Array.isArray(req.body?.sections) ? req.body.sections : [];

    const updated = await Page.findByIdAndUpdate(
      id,
      { name, slug, sections },
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

// Delete page
app.delete("/api/pages/:id", async (req, res) => {
  const deleted = await Page.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Not found" });
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log("API running on port", PORT);
});

