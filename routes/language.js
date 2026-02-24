import express from "express";
import Language from "../models/Language.js";

const router = express.Router();

router.get("/:lang", async (req, res) => {
  try {
    const { lang } = req.params;

    const doc = await Language.findById(lang).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });

    delete doc.__v;
    res.json(doc);
  } catch (err) {
    console.error("Language fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;