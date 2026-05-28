export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "login",
  "logout",
  "profile",
  "register",
  "settings",
  "templates",
  "u",
  "p",
]);

export const normalizeSlug = (value) =>
  `${value || ""}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const isVisibility = (value) => ["public", "unlisted", "private"].includes(value);

export const toPortfolioResponse = (portfolio) => ({
  templateId: portfolio.templateId,
  data: portfolio.data,
  username: portfolio.username,
  status: portfolio.status || "draft",
  visibility: portfolio.visibility || "private",
  slug: portfolio.slug || "",
});
