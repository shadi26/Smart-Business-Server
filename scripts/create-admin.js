// server/scripts/create-admin.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server folder
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function createAdmin() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Define User Schema (must match your server schema)
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ["admin", "manager"], default: "manager" },
      pageId: { type: mongoose.Schema.Types.ObjectId, ref: "Page" },
    }, { timestamps: true, collection: "users" });

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // Admin credentials
    const email = "vynix.s.m@gmail.com";
    const password = "Vynix@#123321";

    // Check if exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log("⚠️ Admin already exists!");
      console.log("Email:", existingUser.email);
      process.exit(0);
    }

    // Hash password and create
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin"
    });

    console.log("\n✅ SUCCESS! Admin created!");
    console.log("Email:", admin.email);
    console.log("Password: [hidden - the one you provided]");
    console.log("\nYou can now login at: http://localhost:3000/login");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createAdmin();