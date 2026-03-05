// routes/languageAdmin.js
import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/**
 * We store translations in MongoDB as 3 docs in collection "language":
 *  _id: "en" | "ar" | "he"
 * each doc contains nested objects and string leaves.
 *
 * We use a strict:false schema so Mongo can store any nested keys.
 */
const LanguageSchema = new mongoose.Schema({}, { strict: false, collection: "language" });
const Language =
  mongoose.models.Language || mongoose.model("Language", LanguageSchema);

// helper: remove _id from response so it doesn't appear as a key in UI
function stripId(doc) {
  if (!doc) return {};
  const obj = doc.toObject ? doc.toObject() : doc;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = obj;
  return rest;
}

// GET /api/language/admin/tree
router.get("/tree", async (req, res) => {
  try {
    const [en, ar, he] = await Promise.all([
      Language.findById("en").lean(),
      Language.findById("ar").lean(),
      Language.findById("he").lean(),
    ]);

    res.json({
      en: stripId(en),
      ar: stripId(ar),
      he: stripId(he),
    });
  } catch (e) {
    console.error("LANG ADMIN tree error:", e);
    res.status(500).json({ message: "Failed to load translation tree." });
  }
});

// PATCH /api/language/admin/value
router.patch("/value", async (req, res) => {
  try {
    const { path, en, ar, he } = req.body || {};
    if (!path) return res.status(400).json({ message: "path is required" });

    await Promise.all([
      Language.updateOne({ _id: "en" }, { $set: { [path]: en ?? "" } }, { upsert: true }),
      Language.updateOne({ _id: "ar" }, { $set: { [path]: ar ?? "" } }, { upsert: true }),
      Language.updateOne({ _id: "he" }, { $set: { [path]: he ?? "" } }, { upsert: true }),
    ]);

    res.json({ ok: true });
  } catch (e) {
    console.error("LANG ADMIN value error:", e);
    res.status(500).json({ message: "Failed to save translation value." });
  }
});

// POST /api/language/admin/key
router.post("/key", async (req, res) => {
  try {
    const { parentPath = "", key, type, en, ar, he } = req.body || {};
    const cleanKey = String(key || "").trim();
    if (!cleanKey) return res.status(400).json({ message: "key is required" });

    const fullPath = parentPath ? `${parentPath}.${cleanKey}` : cleanKey;

    if (type === "object") {
      await Promise.all([
        Language.updateOne({ _id: "en" }, { $set: { [fullPath]: {} } }, { upsert: true }),
        Language.updateOne({ _id: "ar" }, { $set: { [fullPath]: {} } }, { upsert: true }),
        Language.updateOne({ _id: "he" }, { $set: { [fullPath]: {} } }, { upsert: true }),
      ]);
    } else {
      await Promise.all([
        Language.updateOne({ _id: "en" }, { $set: { [fullPath]: en ?? "" } }, { upsert: true }),
        Language.updateOne({ _id: "ar" }, { $set: { [fullPath]: ar ?? "" } }, { upsert: true }),
        Language.updateOne({ _id: "he" }, { $set: { [fullPath]: he ?? "" } }, { upsert: true }),
      ]);
    }

    res.json({ ok: true, path: fullPath });
  } catch (e) {
    console.error("LANG ADMIN key error:", e);
    res.status(500).json({ message: "Failed to add key." });
  }
});

// DELETE /api/language/admin/key
router.delete("/key", async (req, res) => {
  try {
    const { path } = req.body || {};
    if (!path) return res.status(400).json({ message: "path is required" });

    await Promise.all([
      Language.updateOne({ _id: "en" }, { $unset: { [path]: "" } }),
      Language.updateOne({ _id: "ar" }, { $unset: { [path]: "" } }),
      Language.updateOne({ _id: "he" }, { $unset: { [path]: "" } }),
    ]);

    res.json({ ok: true });
  } catch (e) {
    console.error("LANG ADMIN delete error:", e);
    res.status(500).json({ message: "Failed to delete key." });
  }
});

export default router;