export function withSlug(handler, slug) {
  handler.slug = slug;
  return handler;
}
