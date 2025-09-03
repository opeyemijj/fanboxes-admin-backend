const mongoose = require("mongoose");

const permissionItemSchema = new mongoose.Schema({
  slug: { type: String, required: true },
  path: { type: String, required: true },
  name: { type: String, required: true },
});

const RoleSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, unique: true }, // Example: "admin", "moderator", "user"
    permittedItems: {
      type: Map,
      of: [permissionItemSchema], // key = categories, subcategories, box, etc.
    },
  },
  { timestamps: true }
);

const Role = mongoose.models.Role || mongoose.model("Role", RoleSchema);
module.exports = Role;
