import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

await mongoose.connect(process.env.MONGODB_URI);

app.get("/api/seed-language", async (req, res) => {
  const doc = await Language.create({
    _id: "en",
    homepage: {
      hero: {
        title: "Create Beautiful Business Pages",
        subtitle: "Fast and modern"
      }
    }
  });

  res.json({ ok: true, created: doc._id });
});

// --------- Models ----------
const LanguageSchema = new mongoose.Schema(
  { _id: String }, // "ar" / "en" / "he"
  { strict: false, collection: "language" } // allow nested maps like Firestore
);
const Language = mongoose.model("Language", LanguageSchema);

// --------- Routes ----------
app.get("/api/language/:lang", async (req, res) => {
  const lang = req.params.lang;
  const doc = await Language.findById(lang).lean();
  if (!doc) return res.status(404).json({ error: "Not found" });
  delete doc.__v;
  res.json(doc);
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(process.env.PORT || 4000, () => {
  console.log("API running");
});
