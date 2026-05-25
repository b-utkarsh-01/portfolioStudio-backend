import { allowedTemplateIds as TEMPLATE_IDS } from "../seed/templateCatalog.js";

const sanitizeString = (value, maxLength = 1000) =>
  `${value ?? ""}`
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);

const sanitizeStringArray = (value, { maxItems = 30, maxLength = 120 } = {}) =>
  (Array.isArray(value) ? value : [])
    .map((item) => sanitizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);

const sanitizeContacts = (value) =>
  (Array.isArray(value) ? value : [])
    .map((contact) => ({
      type: sanitizeString(contact?.type, 24).toLowerCase(),
      text: sanitizeString(contact?.text, 120),
      href: sanitizeString(contact?.href, 256),
      external: Boolean(contact?.external),
    }))
    .filter((contact) => contact.type && contact.text && contact.href)
    .slice(0, 12);

const sanitizeItems = (value, fields, maxItems = 30) =>
  (Array.isArray(value) ? value : [])
    .map((item) =>
      fields.reduce((acc, field) => {
        acc[field] = sanitizeString(item?.[field], 300);
        return acc;
      }, {})
    )
    .filter((item) => Object.values(item).some(Boolean))
    .slice(0, maxItems);

const sanitizeEducation = (value) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => ({
      subtitle: sanitizeString(entry?.subtitle, 120),
      items: sanitizeItems(entry?.items, ["institute", "degree"], 6),
    }))
    .filter((entry) => entry.subtitle || entry.items.length)
    .slice(0, 20);

const sanitizeSkills = (value) => {
  const skills = value && typeof value === "object" ? value : {};
  return Object.entries(skills).reduce((acc, [group, list]) => {
    const safeGroup = sanitizeString(group, 40);
    if (!safeGroup) return acc;
    const safeList = sanitizeStringArray(list, { maxItems: 30, maxLength: 80 });
    if (safeList.length) acc[safeGroup] = safeList;
    return acc;
  }, {});
};

const sanitizeStages = (value) =>
  (Array.isArray(value) ? value : [])
    .map((stage) => ({
      id: sanitizeString(stage?.id, 40).toLowerCase(),
      title: sanitizeString(stage?.title, 80),
      enabled: stage?.enabled !== false,
    }))
    .filter((stage) => stage.id && stage.title)
    .slice(0, 20);

const sanitizeCustomStages = (value) =>
  (Array.isArray(value) ? value : [])
    .map((stage) => ({
      id: sanitizeString(stage?.id, 40).toLowerCase(),
      kind: stage?.kind === "cards" ? "cards" : "paragraph",
      paragraph: sanitizeString(stage?.paragraph, 4000),
      cards: sanitizeItems(stage?.cards, ["title", "subtitle", "description", "link", "image"], 40),
    }))
    .filter((stage) => stage.id)
    .slice(0, 40);

const sanitizePortfolioData = (data) => {
  const input = data && typeof data === "object" ? data : {};
  const profile = input.profile && typeof input.profile === "object" ? input.profile : {};
  const badge = input.badgeName && typeof input.badgeName === "object" ? input.badgeName : {};
  const layout = input.layout && typeof input.layout === "object" ? input.layout : {};

  return {
    layout: {
      stages: sanitizeStages(layout.stages),
    },
    customStages: sanitizeCustomStages(input.customStages),
    profile: {
      name: sanitizeString(profile.name, 100),
      title: sanitizeStringArray(profile.title, { maxItems: 8, maxLength: 100 }),
      summary: sanitizeString(profile.summary, 1200),
      highlights: sanitizeStringArray(profile.highlights, { maxItems: 12, maxLength: 80 }),
      contacts: sanitizeContacts(profile.contacts),
      avatar: sanitizeString(profile.avatar, 512),
    },
    badgeName: {
      name: sanitizeString(badge.name, 100),
      logo: sanitizeString(badge.logo, 6),
      badgeTitle: sanitizeString(badge.badgeTitle, 120),
    },
    skills: sanitizeSkills(input.skills),
    education: sanitizeEducation(input.education),
    experiences: sanitizeItems(input.experiences, ["title", "company", "period", "description"]),
    projects: sanitizeItems(input.projects, ["name", "tech", "description", "link", "image"]),
    services: sanitizeItems(input.services, ["name", "description"]),
    testimonials: sanitizeItems(input.testimonials, ["name", "role", "quote"]),
    certifications: sanitizeItems(input.certifications, ["name", "provider", "link"]),
  };
};

export const validatePortfolioPayload = (payload) => {
  const rawTemplateId = sanitizeString(payload?.templateId || "default-v1", 40);
  const isPatternValid = /^(default|premium|ai)-[a-z0-9-]+$/i.test(rawTemplateId);
  const templateId = isPatternValid ? rawTemplateId : "";
  const data = sanitizePortfolioData(payload?.data);

  const errors = [];
  if (!templateId) {
    errors.push(
      `templateId must match pattern: default-*, premium-*, or ai-* (allowed examples: ${TEMPLATE_IDS.join(", ")})`
    );
  }
  if (!data.profile.name) {
    errors.push("profile.name is required.");
  }

  return {
    ok: errors.length === 0,
    errors,
    value: {
      templateId: templateId || "default-v1",
      data,
    },
  };
};

export const allowedTemplateIds = TEMPLATE_IDS;
