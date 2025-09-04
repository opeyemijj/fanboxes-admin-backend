// utils/routeCollector.js
function collectRoutes(app) {
  const routes = {};

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const { path, stack, methods } = middleware.route;
      stack.forEach((layer) => {
        if (layer.handle.slug) {
          addRoute(routes, path, methods, layer.handle.slug);
        }
      });
    } else if (middleware.name === "router" && middleware.handle.stack) {
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

function addRoute(routes, path, methods, slug) {
  const method = Object.keys(methods)[0].toUpperCase();
  const fullPath = `${method}:${path}`;

  // ✅ Category: strictly take the first segment after "/admin/"
  const parts = path.split("/").filter(Boolean);
  const adminIndex = parts.indexOf("admin");

  let category = null;
  if (adminIndex !== -1 && parts.length > adminIndex + 1) {
    category = parts[adminIndex + 1];
  }

  // ⛔ Skip if no valid category
  if (!category) return;

  if (!routes[category]) routes[category] = [];

  const entry = {
    slug,
    path: fullPath,
    name: unslug(slug),
  };

  if (
    !routes[category].some(
      (r) => r.slug === entry.slug && r.path === entry.path
    )
  ) {
    routes[category].push(entry);
  }
}

function unslug(slug) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = { collectRoutes };
