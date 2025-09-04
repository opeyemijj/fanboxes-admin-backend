export function withSlug(handler, slug) {
  const wrapped = (req, res, next) => handler(req, res, next);
  wrapped.slug = slug;
  return wrapped;
}
