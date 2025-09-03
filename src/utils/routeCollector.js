// utils/routeCollector.js
function collectRoutes(app) {
  const routes = {};

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Directly registered route
      const { path, stack, methods } = middleware.route;
      stack.forEach((layer) => {
        if (layer.handle.slug) {
          addRoute(routes, path, methods, layer.handle.slug);
        }
      });
    } else if (middleware.name === "router" && middleware.handle.stack) {
      // Nested routers
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const { path, stack, methods } = handler.route;
          stack.forEach((layer) => {
            if (layer.handle.slug) {
              addRoute(routes, path, methods, layer.handle.slug);
            }
          });
        }
      });
    }
  });

  return routes;
}

// Helper to add routes safely (deduplicated)
function addRoute(routes, path, methods, slug) {
  const method = Object.keys(methods)[0].toUpperCase();
  const fullPath = `${method}:${path}`;

  // Use mapping to determine category
  const pathCategoryMap = {
    products: "box",
    "product-active": "box",
    "product-banned": "box",
    "item-odds-visibility": "box",
    boxItem: "box",
    boxItemOdd: "box",
    "product-item": "box",

    shops: "influencer",
    "shop-active": "influencer",
    "shop-banned": "influencer",
  };

  const categoryKey = path.split("/")[2]; // 3rd part of path
  const category = pathCategoryMap[categoryKey] || "general";

  if (!routes[category]) routes[category] = [];

  const entry = {
    slug,
    path: fullPath,
    name: unslug(slug),
  };

  // prevent duplicates
  if (
    !routes[category].some(
      (r) => r.slug === entry.slug && r.path === entry.path
    )
  ) {
    routes[category].push(entry);
  }
}

// Helper to convert slug -> clean name
function unslug(slug) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize words
}

module.exports = { collectRoutes };
