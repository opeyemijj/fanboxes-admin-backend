const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, unique: true }, // Example: "admin", "moderator", "user"
    slug: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: false },
    permittedItems: [
      {
        type: String,
        trim: true,
        minlength: 1,
      },
    ],
  },
  { timestamps: true }
);

const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);
module.exports = Role;
