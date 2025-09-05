const express = require("express");
const router = express.Router();
const { collectRoutes } = require("../utils/routeCollector");
const role = require("../controllers/role");
const verifyToken = require("../config/jwt");
const { withSlug } = require("../helpers/routeSlugHelper");

// This will expose all routes with slugs to the frontend
router.get("/admin/available-routes", (req, res) => {
  const routes = collectRoutes(req.app);

  return res.status(200).json({
    success: true,
    data: routes,
    message: "All routes are fetching successfully",
  });
});

router.post(
  "/admin/roles",
  verifyToken,
  withSlug(role.createRoleByAdmin, "add_new_role")
);
router.get(
  "/admin/roles",
  verifyToken,
  withSlug(role.getRolesByAdmin, "view_role_listing")
);

router.get(
  "/admin/roles/:slug",
  verifyToken,
  withSlug(role.getRoleByAdmin, "view_role_details")
);

router.put(
  "/admin/roles/:slug",
  verifyToken,
  withSlug(role.updateRoleByAdmin, "edit_role")
);

router.delete(
  "/admin/roles/:slug",
  verifyToken,
  withSlug(role.deleteRoleByAdmin, "delete_role")
);

module.exports = router;
