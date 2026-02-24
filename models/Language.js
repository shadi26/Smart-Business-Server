import mongoose from "mongoose";

const LanguageSchema = new mongoose.Schema(
  { _id: String },
  { strict: false, collection: "language" }
);

export default mongoose.model("Language", LanguageSchema);