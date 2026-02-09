import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Dev-friendly CORS (you can restrict later)
app.use(cors());
app.use(express.json());

// ---------- Mongo ----------
await mongoose.connect(process.env.MONGODB_URI);
console.log("Mongo connected");

// ---------- Models ----------

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

