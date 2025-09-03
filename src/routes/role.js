const express = require("express");
const router = express.Router();
const { collectRoutes } = require("../utils/routeCollector");
const role = require("../controllers/role");
const verifyToken = require("../config/jwt");

// This will expose all routes with slugs to the frontend
router.get("/admin/available-routes", (req, res) => {
  const routes = collectRoutes(req.app);

  return res.status(200).json({
    success: true,
    data: routes,
    message: "All routes are fetching successfully",
  });
});

router.post("/admin/roles", verifyToken, role.createRole);

module.exports = router;
