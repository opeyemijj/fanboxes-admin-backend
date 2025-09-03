const express = require("express");
const router = express.Router();
const { collectRoutes } = require("../utils/routeCollector");

// This will expose all routes with slugs to the frontend
router.get("/available-routes", (req, res) => {
  const routes = collectRoutes(req.app);
  res.json(routes);
});

module.exports = router;
